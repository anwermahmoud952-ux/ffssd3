import { GoogleGenAI, Type, Modality, GenerateContentResponse, GenerateImagesResponse } from '@google/genai';
import { FarmStats, Scenario, Action, Outcome, HistoryEntry, ScenarioData, SoilType, CropName } from '../types';

// FIX: Initialize GoogleGenAI with API key from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * A utility function to wrap API calls with retry logic, specifically for rate limiting errors.
 * @param apiCall The async function to call.
 * @param maxRetries Maximum number of retries.
 * @param initialDelay Initial delay in ms, doubles on each retry.
 * @returns The result of the apiCall.
 */
async function withRetry<T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      // Convert error to string to check for rate limit indicators
      const errorString = error instanceof Error ? error.message : JSON.stringify(error);
      const isRateLimitError = errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED');

      if (isRateLimitError && attempt < maxRetries - 1) {
        console.warn(`Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        delay *= 2; // Exponential backoff
      } else {
        // If it's not a rate limit error or we've exhausted retries, throw the error.
        console.error(`API call failed after ${attempt + 1} attempts or was not a rate limit error.`, error);
        throw error;
      }
    }
  }
  // This line is theoretically unreachable but required for TypeScript to be happy.
  throw new Error('Exceeded max retries for API call.');
}


const model = 'gemini-2.5-flash';

const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: "حكاية ممتعة ومبتكرة باللهجة المصرية العامية لسيناريو الجولة الحالية في اللعبة." },
    challenge: { type: Type.STRING, description: "تحدي واضح ومختصر للاعب عشان يتعامل معاه باللهجة المصرية العامية." },
    data: {
      type: Type.OBJECT,
      properties: {
        temperature: { type: Type.NUMBER, description: "متوسط درجة الحرارة بالدرجة المئوية." },
        rainfall: { type: Type.NUMBER, description: "كمية المطر بالملليمتر." },
        soilMoisture: { type: Type.NUMBER, description: "مستوى رطوبة التربة كنسبة مئوية (0-100)." },
        ndvi: { type: Type.NUMBER, description: "مؤشر NDVI، قيمة بين 0 و 1 بتدل على صحة النبات." },
        humidity: { type: Type.NUMBER, description: "نسبة الرطوبة في الهواء (0-100)." },
        windSpeed: { type: Type.NUMBER, description: "سرعة الرياح بالكيلومتر في الساعة." },
        cloudCover: { type: Type.NUMBER, description: "نسبة تغطية السحب للسماء (0-100)." },
        pressure: { type: Type.NUMBER, description: "الضغط الجوي بالهكتوباسكال." },
      },
      required: ['temperature', 'rainfall', 'soilMoisture', 'ndvi', 'humidity', 'windSpeed', 'cloudCover', 'pressure'],
    },
  },
  required: ['narrative', 'challenge', 'data'],
};

const outcomeSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: "حكاية بتوصف نتيجة قرار اللاعب، وبتشرح التغييرات في الإحصائيات باللهجة المصرية العامية مع التركيز على الأثر البيئي، وتتضمن 'نصيحة استدامة:' في نهايتها." },
    updatedStats: {
      type: Type.OBJECT,
      properties: {
        cropHealth: { type: Type.NUMBER, description: "صحة الزرع الجديدة كنسبة مئوية (0-100)." },
        soilMoisture: { type: Type.NUMBER, description: "رطوبة التربة الجديدة كنسبة مئوية (0-100)." },
        waterReserves: { type: Type.NUMBER, description: "مخزون المياه الجديد كنسبة مئوية (0-100)." },
        soilType: { type: Type.STRING, description: "نوع التربة، يجب أن يبقى كما هو." },
        cropType: { type: Type.STRING, description: "نوع المحصول، يجب أن يبقى كما هو." },
      },
      required: ['cropHealth', 'soilMoisture', 'waterReserves', 'soilType', 'cropType'],
    },
  },
  required: ['narrative', 'updatedStats'],
};

const tipsSchema = {
  type: Type.OBJECT,
  properties: {
    tips: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "نصيحة قصيرة ومفيدة باللهجة المصرية لتحسين أداء اللاعب في الزراعة المستدامة."
      }
    }
  },
  required: ['tips']
};

const generatePromptForScenario = (history: HistoryEntry[], currentStats: FarmStats): string => {
    const lastAction = history.length > 0 ? history[history.length - 1].action : 'NONE';
    return `
أنت خبير الزراعة المستدامة في لعبة "اتحضر للأخضر"، ومهمتك هي إنشاء سيناريو تعليمي جديد ومميز للاعب باللهجة المصرية العامية.

**سياق اللعبة:**
اللاعب يدير مزرعة بهدف تطبيق ممارسات مستدامة. القرارات تركز على التأثير البيئي طويل الأمد وليس الربح المادي.

**إحصائيات المزرعة الحالية:**
- صحة الزرع: ${currentStats.cropHealth}%
- رطوبة التربة: ${currentStats.soilMoisture}%
- مخزون المياه: ${currentStats.waterReserves}%
- نوع التربة: ${currentStats.soilType}
- نوع المحصول: ${currentStats.cropType}

**ملخص الجولات اللي فاتت:**
${history.length > 0 ? history.map(h => `الجولة ${h.round}: اللاعب واجه "${h.scenario.challenge}"، واختار ${h.action}، وده أدى لـ "${h.outcome.narrative.substring(0, 100)}..."`).join('\n') : "دي أول جولة."}

**مهمتك:**
اخلق سيناريو مقنع ومنطقي للجولة الجاية. السيناريو لازم يقدم تحدي جديد يتعلق بالاستدامة. **مهم جدًا تربط التحدي بنوع التربة الحالي (${currentStats.soilType}) ونوع المحصول (${currentStats.cropType}).**
على سبيل المثال، محصول زي "الأرز" يحتاج مياه كتير، فتحدي الجفاف هيكون مؤثر جدًا عليه. محصول "القطن" حساس للآفات.

**تأثير بيئي:** قرارات اللاعب ليها تأثير بيئي. خد في اعتبارك آخر قرار للاعب (${lastAction}) عشان تأثر على طقس السيناريو الجديد.
- لو القرار كان 'FERTILIZE' (باستخدام سماد عضوي) أو 'PEST_CONTROL' (باستخدام مكافحة حيوية)، ممكن ده يحسن التنوع البيولوجي بشكل بسيط.
- لو القرار كان 'IRRIGATE' بحكمة، ممكن الرطوبة تزيد.
- لو القرار كان 'CONSERVE'، ممكن صحة التربة تتحسن تدريجيًا.
اعكس ده في قيم البيانات والحكاية.

**اكتب الآتي في ردك (باللهجة المصرية العامية):**
1.  **narrative (الحكاية)**: قصة قصيرة وتعليمية بتوصف الوضع الحالي في المزرعة، مع التركيز على المحصول المزروع (${currentStats.cropType}) وعلاقته بنوع التربة والطقس (بما في ذلك الحرارة، المطر، الرياح، الرطوبة، إلخ).
2.  **challenge (التحدي)**: ملخص للمشكلة البيئية اللي اللاعب محتاج يحلها، وتكون ليها علاقة بالمحصول.
3.  **data (البيانات)**: بيانات بيئية أساسية للسيناريو (الحرارة، المطر، رطوبة التربة، NDVI، الرطوبة، سرعة الرياح، الغيوم، الضغط).

اتأكد إن قيم البيانات منطقية مع الحكاية اللي بتكتبها.
`;
};

const generatePromptForOutcome = (currentStats: FarmStats, scenario: Scenario, action: Action): string => `
أنت خبير الزراعة المستدامة في لعبة "اتحضر للأخضر"، ومهمتك هي تحليل نتيجة قرار اللاعب من منظور بيئي وتعليمي باللهجة المصرية العامية.

**إحصائيات المزرعة الحالية:**
- صحة الزرع: ${currentStats.cropHealth}%
- رطوبة التربة: ${currentStats.soilMoisture}%
- مخزون المياه: ${currentStats.waterReserves}%
- نوع التربة: ${currentStats.soilType}
- نوع المحصول: ${currentStats.cropType}

**السيناريو الحالي:**
- الحكاية: "${scenario.narrative}"
- التحدي: "${scenario.challenge}"
- البيانات: درجة الحرارة: ${scenario.data.temperature}°م، المطر: ${scenario.data.rainfall}مم، رطوبة التربة: ${scenario.data.soilMoisture}%، مؤشر NDVI: ${scenario.data.ndvi}، الرطوبة: ${scenario.data.humidity}%، سرعة الرياح: ${scenario.data.windSpeed} كم/س، الغيوم: ${scenario.data.cloudCover}%، الضغط: ${scenario.data.pressure} hPa.

**قرار اللاعب:** ${action}

**فلسفة القرارات (للتذكير):**
- IRRIGATE (الري): استخدام المياه بحكمة.
- FERTILIZE (التسميد): استخدام الأسمدة العضوية.
- PEST_CONTROL (مكافحة الآفات): استخدام الطرق الحيوية.
- CONSERVE (الحفاظ): تطبيق تقنيات للحفاظ على التربة والمياه.

**مهمتك:**
1.  اكتب **narrative (حكاية)** تعليمية وعميقة. الحكاية لازم تشرح بالتفصيل **لماذا** أدى قرار اللاعب (${action}) إلى هذه النتائج، مع ربط مباشر بالنقاط التالية:
    *   **تأثير نوع المحصول (${currentStats.cropType}):** اشرح كيف تفاعل القرار مع احتياجات المحصول. مثلاً، "بما إنك بتزرع بطيخ، قرار الري كان مهم جدًا في الحر ده عشان تحافظ على حجم الثمار." أو "القمح محصول شتوي، فالتسميد في الوقت ده هيساعده يكوّن سنابل قوية."
    *   **تأثير نوع التربة (${currentStats.soilType}):** اشرح كيف تفاعل القرار مع خصائص التربة. مثلاً، "لأن تربتك رملية ('SANDY'), استخدام السماد العضوي ('FERTILIZE') يعتبر استثمار طويل الأمد؛ التربة لا تحتفظ بالمغذيات بسهولة، لذا التحسن في صحة الزرع بطيء ولكنه مستدام."
    *   **الظروف الجوية (درجة الحرارة، المطر، الرياح، إلخ):** وضح كيف أثر الطقس على نتيجة القرار. مثلاً، "الري ('IRRIGATE') في يوم حرارته عالية مع رياح شديدة أدى لتبخر جزء كبير من المياه، مما قلل من فعاليته."
    *   **تفسير تغيير الإحصائيات:** علق بشكل مباشر على التغير في صحة الزرع، ورطوبة التربة، ومخزون المياه. اشرح سبب الزيادة أو النقصان.
2.  في نهاية الحكاية، أضف **"نصيحة استدامة:"** تكون مخصصة جدًا للحالة الجديدة. النصيحة يجب أن تكون قابلة للتنفيذ وتعتمد على الإحصائيات **الجديدة** التي حسبتها ونوع التربة (${currentStats.soilType}).
    *   **مثال ١:** لو صحة الزرع اتحسنت لكن مخزون المياه قل بشكل كبير في تربة رملية، النصيحة ممكن تكون: "نصيحة استدامة: ممتاز إن صحة الزرع اتحسنت، لكن في التربة الرملية ('SANDY') حاول تستخدم تقنيات زي الري بالتنقيط عشان تقلل استهلاك المياه المرة الجاية."
    *   **مثال ٢:** لو رطوبة التربة زادت جدًا وصحة الزرع قلت، النصيحة ممكن تكون: "نصيحة استدامة: زيادة الري أكتر من اللازم ممكن تضر الجذور وتسبب تعفنها. راقب حالة الزرع كويس قبل ما تاخد قرار الري."
    *   **مثال ٣:** لو اخترت 'CONSERVE' والإحصائيات متحسنتش كتير، النصيحة ممكن تكون: "نصيحة استدامة: الحفاظ على الموارد بياخد وقت عشان نتايجه تظهر، لكنه بيبني صحة التربة على المدى الطويل. استمر في الممارسات دي."
3.  احسب **updatedStats (الإحصائيات الجديدة)**. التغييرات لازم تكون واقعية وتعكس الأثر طويل المدى.
    - الري المفرط في التربة الرملية يهدر المياه.
    - التسميد العضوي يحسن صحة الزرع ببطء ولكنه يبني صحة التربة.
    - الحفاظ على الموارد قد لا يعطي نتائج فورية ولكنه مفيد جدًا على المدى الطويل.
    - **مهم جدًا:** قيم \`soilType\` و \`cropType\` في \`updatedStats\` لازم تفضل زي ما هي.

احسب القيم الجديدة لصحة الزرع، ورطوبة التربة، ومخزون المياه. خلي القيم بين 0 و 100.
`;

const generatePromptForScenarioFromData = (data: ScenarioData, soilType: SoilType, cropType: CropName): string => `
أنت خبير الزراعة المستدامة في لعبة "اتحضر للأخضر"، ومهمتك هي إنشاء سيناريو ترحيبي وتعليمي للاعب بناءً على البيانات اللي هو اختارها.

**سياق اللعبة:**
دي أول جولة. اللاعب أدخل هذه البيانات لبدء محاكاة واقعية تركز على الاستدامة.

**البيانات من اللاعب:**
- درجة الحرارة: ${data.temperature}°م
- المطر: ${data.rainfall}مم
- رطوبة التربة: ${data.soilMoisture}%
- مؤشر NDVI: ${data.ndvi}
- الرطوبة: ${data.humidity}%
- سرعة الرياح: ${data.windSpeed} كم/س
- الغيوم: ${data.cloudCover}%
- الضغط: ${data.pressure} hPa
- نوع التربة: ${soilType}
- نوع المحصول: ${cropType}

**مهمتك:**
اخلق سيناريو افتتاحي مقنع للجولة الأولى يكون متوافق تمامًا مع البيانات اللي اللاعب دخلها، مع لمسة تعليمية عن الزراعة المستدامة.

**اكتب الآتي في ردك (باللهجة المصرية العامية):**
1.  **narrative (الحكاية)**: قصة قصيرة وممتعة بتوصف الوضع في المزرعة بناءً على البيانات. اربطها بمفهوم مستدام (مثلاً، لو التربة رملية والمحصول بطيخ والحرارة عالية، "أرضك الرملية الجميلة محتاجة حكمة في الري عشان تحافظ على كل نقطة مية وتضمن إن البطيخ ياخد كفايته...").
2.  **challenge (التحدي)**: ملخص للمشكلة أو الفرصة البيئية المتعلقة بالمحصول اللي اللاعب محتاج يتعامل معاها.
`;

const generatePromptForGameSummary = (finalStats: FarmStats, history: HistoryEntry[]): string => `
أنت خبير زراعة مستدامة ودود، ومهمتك هي تقديم نصائح مخصصة للاعب بعد انتهاء محاكاة لعبة "اتحضر للأخضر".

**تحليل أداء اللاعب:**

**الإحصائيات النهائية:**
- صحة الزرع: ${finalStats.cropHealth}%
- رطوبة التربة: ${finalStats.soilMoisture}%
- مخزون المياه: ${finalStats.waterReserves}%

**ملخص القرارات خلال اللعبة:**
${history.length > 0 ? history.map(h => `- الجولة ${h.round}: واجه اللاعب تحدي "${h.scenario.challenge.substring(0, 50)}..." واختار قرار "${h.action}".`).join('\n') : "لم يتخذ اللاعب أي قرارات."}

**مهمتك:**
بناءً على البيانات السابقة، اكتب 2 إلى 3 نصائح قصيرة ومفيدة باللهجة المصرية العامية. النصائح يجب أن تكون:
1.  **شخصية:** مرتبطة مباشرة بالإحصائيات النهائية وقرارات اللاعب.
2.  **قابلة للتنفيذ:** تقدم اقتراحات واضحة يمكن للاعب تطبيقها في محاولته القادمة.
3.  **مشجعة:** حتى لو خسر اللاعب، حافظ على نبرة إيجابية وركز على التعلم.
4.  **مركزة على الاستدامة:** اربط النصائح بالمفاهيم البيئية الأساسية في اللعبة.

**أمثلة على النصائح الجيدة:**
- لو مخزون المياه انتهى: "لاحظت إن مخزون المياه عندك قل جامد. في المرة الجاية، حاول تستخدم قرار 'الحفاظ' أكتر، خصوصًا في الأيام الحارة، عشان تحافظ على كل نقطة مية."
- لو صحة الزرع كانت متقلبة: "صحة الزرع كانت زي الأسانسير، طالعة نازلة. ده ممكن يكون بسبب إنك كنت بتركز على حل المشكلة الحالية بس. حاول تفكر في التأثير طويل الأمد لقراراتك، زي استخدام السماد العضوي اللي بيبني صحة التربة بالتدريج."
- لو اللاعب استخدم 'IRRIGATE' كتير: "استخدامك للري كان كتير شوية. افتكر إن الري الزيادة ممكن يضر الجذور ويهدر مياه. بص دايمًا على نسبة رطوبة التربة قبل ما تاخد قرار الري."

**المطلوب:**
قدم النصائح في صيغة JSON.
`;

const getSoilVisualDescription = (soilType: SoilType): string => {
    switch (soilType) {
        case 'SILTY':
            return 'The soil is silty, appearing dark, fertile, and well-structured, capable of retaining moisture well.';
        case 'SANDY':
            return 'The soil is sandy, looking light-colored and granular, with a texture that suggests it drains water quickly.';
        case 'CHALKY':
            return 'The soil is chalky, with a pale, stony appearance. It might look dry and alkaline.';
        case 'SALINE':
            return 'The soil is saline, with subtle white, crystalline patches on the surface, indicating high salt content.';
        case 'ROCKY':
            return 'The soil is rocky, visibly mixed with many small to medium-sized stones and pebbles, making it look rugged and less fertile.';
        default:
            return 'The soil appears normal.';
    }
};

export const generateOrUpdateFarmImage = async (
    scenario: Scenario,
    previousImageBase64: string | null,
    outcomeNarrative: string,
    cropType: CropName,
    soilType: SoilType
): Promise<string | null> => {
    try {
        const soilDescription = getSoilVisualDescription(soilType);

        // Case 1: First round, generate a new image from scratch
        if (!previousImageBase64) {
            const imagePrompt = `A photorealistic, vibrant, wide-angle cinematic shot of a modern sustainable farm in rural Egypt, with fields of ${cropType}. The image must visually represent this specific situation: "${scenario.narrative}". 

            Crucially, the image must reflect these data points:
            - **Soil Type**: ${soilDescription}
            - **Crop Health (NDVI ${scenario.data.ndvi.toFixed(2)})**: A high NDVI (near 1.0) means very lush, healthy, green plants. A low NDVI (near 0) means sparse, unhealthy, or brown/yellow plants.
            - **Soil Moisture (${scenario.data.soilMoisture}%)**: High moisture means the soil should look dark and wet. Low moisture means the soil should look dry, light-colored, and possibly cracked.
            - **Weather**: The scene should reflect a temperature of ${scenario.data.temperature}°C, rainfall of ${scenario.data.rainfall}mm, wind speed of ${scenario.data.windSpeed} km/h (e.g. slight sway in crops), cloud cover of ${scenario.data.cloudCover}% (high cover means overcast, low means clear skies), and humidity of ${scenario.data.humidity}% (high humidity could create a light haze).

            The style must be highly realistic and detailed, emphasizing ecological balance.`;

            // FIX: Add explicit type for generateImages response to resolve property access errors.
            const response: GenerateImagesResponse = await withRetry(() => ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            }));

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
            return null;
        }
        // Case 2: Subsequent rounds, edit the existing image
        else {
            const editPrompt = `Edit the provided image to reflect a change in the farm's condition. The farm is growing ${cropType}. The previous action resulted in this outcome: "${outcomeNarrative}". 
            
            The new state of the farm is now characterized by these data points:
            - **Soil Type**: ${soilDescription}
            - **Crop Health (NDVI ${scenario.data.ndvi.toFixed(2)})**: Adjust the plants' health. Higher NDVI means greener and more lush. Lower means more sparse or yellowish.
            - **Soil Moisture (${scenario.data.soilMoisture}%)**: Modify the soil's appearance. Higher moisture means darker, wetter-looking soil. Lower means drier, lighter, possibly cracked.
            - **Weather**: The atmosphere should reflect a temperature of ${scenario.data.temperature}°C, rainfall of ${scenario.data.rainfall}mm, wind speed of ${scenario.data.windSpeed} km/h (e.g. show plants swaying), cloud cover of ${scenario.data.cloudCover}% (e.g. add or remove clouds), and humidity of ${scenario.data.humidity}%.

            Preserve the original image's composition and perspective. The changes should be noticeable but realistic evolutions of the previous state.`;

            const base64Data = previousImageBase64.split(',')[1];
            
            // FIX: Add explicit type for generateContent response to resolve property access errors.
            const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: 'image/jpeg',
                            },
                        },
                        {
                            text: editPrompt,
                        },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            }));
            
            if (response.candidates && response.candidates.length > 0) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        return `data:image/jpeg;base64,${base64ImageBytes}`;
                    }
                }
            }
            // If editing fails, return the original image to avoid a jarring empty state.
            return previousImageBase64;
        }
    } catch (error) {
        console.error("Error generating or updating farm image:", error);
        return previousImageBase64 || null; // Fallback to previous image on error or null if it's the first image.
    }
};


export const generateScenario = async (history: HistoryEntry[], currentStats: FarmStats): Promise<Scenario> => {
  try {
    const contents = generatePromptForScenario(history, currentStats);
    // FIX: Add explicit type for generateContent response to resolve property access errors.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: scenarioSchema,
        temperature: 0.8,
      },
    }));

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating scenario:", error);
    // Provide a fallback scenario in case of API failure
    return {
      narrative: "القمر الصناعي فيه مشكلة ومش عارفين نجيب آخر تقرير للطقس. السما شكلها صافية دلوقتي، بس قلبك حاسس بحاجة.",
      challenge: "خد قرارك بمعلومات ناقصة.",
      data: {
        temperature: 25,
        rainfall: 2,
        soilMoisture: 55,
        ndvi: 0.7,
        humidity: 60,
        windSpeed: 10,
        cloudCover: 20,
        pressure: 1012,
      }
    };
  }
};

export const generateScenarioFromData = async (data: ScenarioData, soilType: SoilType, cropType: CropName): Promise<Scenario> => {
    const schemaForTextOnly = {
        type: Type.OBJECT,
        properties: {
            narrative: { type: Type.STRING, description: "حكاية ممتعة ومبتكرة باللهجة المصرية العامية لسيناريو الجولة الحالية في اللعبة بناءً على بيانات الطقس المعطاة." },
            challenge: { type: Type.STRING, description: "تحدي واضح ومختصر للاعب عشان يتعامل معاه باللهجة المصرية العامية بناءً على بيانات الطقس المعطاة." },
        },
        required: ['narrative', 'challenge'],
    };

    try {
        const contents = generatePromptForScenarioFromData(data, soilType, cropType);
        // FIX: Add explicit type for generateContent response to resolve property access errors.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model,
            contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schemaForTextOnly,
                temperature: 0.7,
            },
        }));

        const text = response.text.trim();
        const generatedText = JSON.parse(text);
        
        return {
            ...generatedText,
            data: data,
        };

    } catch (error) {
        console.error("Error generating scenario from data:", error);
        return {
            narrative: "القمر الصناعي فيه مشكلة، بس إحنا هنعتمد على البيانات اللي أنت دخلتها. الجو حسب كلامك، محتاج تركيز.",
            challenge: "خد قرارك بناءً على البيانات اللي أدخلتها.",
            data: data,
        };
    }
};

export const calculateOutcome = async (
  currentStats: FarmStats,
  scenario: Scenario,
  action: Action,
): Promise<Outcome> => {
  try {
    const contents = generatePromptForOutcome(currentStats, scenario, action);
    // FIX: Add explicit type for generateContent response to resolve property access errors.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: outcomeSchema,
        temperature: 0.5,
      },
    }));

    const text = response.text.trim();
    const outcomeResult = JSON.parse(text);
    // Ensure cropType is preserved
    if (!outcomeResult.updatedStats.cropType) {
        outcomeResult.updatedStats.cropType = currentStats.cropType;
    }
    return outcomeResult;
  } catch(error) {
    console.error("Error calculating outcome:", error);
    // Provide a simple, predictable fallback outcome
    const updatedStats = { ...currentStats };
    return {
      narrative: `بسبب مشكلة في السيستم، النتيجة بالظبط مش محسوبة. أنت التزمت بـ ${action.toLowerCase().replace('_', ' ')}، وربنا يستر.`,
      updatedStats,
    };
  }
};

export const generateGameSummaryTips = async (finalStats: FarmStats, history: HistoryEntry[]): Promise<string[]> => {
  try {
    const contents = generatePromptForGameSummary(finalStats, history);
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: tipsSchema,
        temperature: 0.6,
      },
    }));

    const text = response.text.trim();
    const result = JSON.parse(text);
    return result.tips || [];
  } catch (error) {
    console.error("Error generating game summary tips:", error);
    return []; // Return empty array on failure
  }
};
