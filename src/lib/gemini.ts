import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type MessageRole = "user" | "model";

export interface AppTransformData {
  appName: string;
  htmlCode: string;
  isSimulation: boolean;
  messageToUser: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isStreaming?: boolean;
  error?: boolean;
  transformData?: AppTransformData;
}

const transformDeclaration: FunctionDeclaration = {
  name: "transformIntoApp",
  description: "يستخدم للتحول إلى تطبيق. يولد كود HTML/CSS/JS كامل للتطبيق المطلوب.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: { type: Type.STRING, description: "اسم التطبيق" },
      htmlCode: { type: Type.STRING, description: "كود HTML كامل مع CSS و JS مدمج. لا تستخدم أي روابط خارجية (CDNs) للتصميم أو البرمجة. اكتب كل تنسيقات CSS داخل وسوم <style> واستخدم CSS الحديث (Flexbox/Grid) ليكون التصميم احترافياً. يجب أن يكون الكود مستقلاً تماماً وقابلاً للتشغيل دون إنترنت." },
      isSimulation: { type: Type.BOOLEAN, description: "true إذا كان التطبيق معقداً ويحتاج خوادم (محاكاة واجهة فقط)، false إذا كان تطبيقاً بسيطاً يعمل بالكامل (مثل آلة حاسبة)." },
      messageToUser: { type: Type.STRING, description: "رسالة تخبر المستخدم أنك تتحول الآن." }
    },
    required: ["appName", "htmlCode", "isSimulation", "messageToUser"]
  }
};

export async function* streamMessage(message: string, history: ChatMessage[] = [], customInstructions?: string) {
  try {
    const contents = history.map(msg => {
      let text = msg.text;
      if (msg.transformData) {
        text += `\n[ملاحظة للنظام: قام المتحول بالتحول إلى تطبيق: ${msg.transformData.appName}]`;
      }
      return {
        role: msg.role,
        parts: [{ text: text }]
      };
    });
    
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    let finalSystemInstruction = `أنت مساعد ذكي ومفيد باللغة العربية. اسمك 'المتحول' (Mystique). 
لديك قدرة خارقة على التحول إلى أي تطبيق يطلبه المستخدم.
عندما يطلب منك المستخدم التحول إلى تطبيق (مثل: "تحول إلى آلة حاسبة"، "كن تطبيق طقس"، "استنسخ واتساب"):
يجب عليك استخدام أداة 'transformIntoApp' حصراً لتوليد كود التطبيق والتحول إليه.
لا تقم بكتابة كود التطبيق في نص الدردشة العادي.
- إذا كان التطبيق بسيطاً (آلة حاسبة، لعبة بسيطة، ساعة، مفكرة): اجعله يعمل بالكامل (isSimulation: false).
- **هام جداً لحفظ البيانات محلياً:** إذا كان التطبيق يحتاج لحفظ بيانات شخصية (مثل المفكرة)، استخدم \`localStorage\`.
- **السلاح السري (الذاكرة الحية Real-time):** إذا طلب المستخدم تطبيقاً تفاعلياً جماعياً (مثل: دردشة، واتساب، لعبة جماعية، تويتر)، استخدم جسر البيانات السحابي الخاص بنا!
  - لحفظ بيانات في السحابة: 
    \`window.parent.postMessage({ type: 'MYSTIQUE_SAVE', collection: 'messages', data: { text: 'مرحبا', user: 'أحمد', time: Date.now() } }, '*');\`
  - للاستماع للتحديثات الحية (Real-time):
    \`window.parent.postMessage({ type: 'MYSTIQUE_LISTEN', collection: 'messages' }, '*');\`
  - لاستقبال التحديثات في كودك:
    \`window.addEventListener('message', (e) => { if(e.data.type === 'MYSTIQUE_UPDATE' && e.data.collection === 'messages') { const allData = e.data.data; /* قم بتحديث واجهة التطبيق هنا باستخدام المصفوفة allData */ } });\`
- **الحواس الخارجية (Open APIs):** إذا طلب المستخدم تطبيقاً يعتمد على بيانات حقيقية (طقس، عملات رقمية، أخبار)، استخدم واجهات برمجة التطبيقات المفتوحة (Public APIs) المجانية التي لا تتطلب مفاتيح (No API Key) وتدعم CORS.
  - للطقس استخدم: \`https://api.open-meteo.com/v1/forecast?latitude=24.71&longitude=46.67&current_weather=true\`
  - للعملات الرقمية استخدم: \`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd\`
  - استخدم \`fetch()\` واجلب البيانات واعرضها بتصميم احترافي.
- **مخزن الحلفاء (الصور كـ Base64):** إذا طلب المستخدم تطبيقاً يرفع صوراً (مثل انستجرام أو بروفايل)، لا تستخدم خوادم تخزين. استخدم \`FileReader\` لتحويل الصورة إلى نص \`Base64\`، ثم احفظها في الذاكرة الحية عبر \`MYSTIQUE_SAVE\`.
  مثال: \`const reader = new FileReader(); reader.onload = () => { const base64 = reader.result; /* احفظ base64 في السحابة */ }; reader.readAsDataURL(file);\`
- **الاتصال المباشر (WebRTC - مكالمات الفيديو والصوت):** إذا طلب تطبيق مكالمات فيديو أو صوت، استخدم \`RTCPeerConnection\` و \`navigator.mediaDevices.getUserMedia\`. استخدم جسر البيانات السحابي (\`MYSTIQUE_SAVE\` و \`MYSTIQUE_LISTEN\`) كخادم إشارات (Signaling Server) لتبادل الـ (Offer, Answer, ICE Candidates) بين المتصلين.
- **بروتوكول المناعة (Code Immunity):** غلف كل أكوادك البرمجية (JS) بـ \`try/catch\`. إذا حدث خطأ، لا تجعل التطبيق ينهار (شاشة بيضاء)، بل اعرض رسالة خطأ أنيقة للمستخدم داخل الواجهة.
- **التعافي الذاتي (Self-Healing APIs):** عند استخدام \`fetch\`، تعامل مع الأخطاء (Network Errors) بذكاء. إذا فشل الاتصال، اعرض رسالة مثل "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً" بدلاً من تجميد التطبيق.
- **إدارة الذاكرة (Memory Management):** تأكد من تنظيف (Cleanup) مستمعات الأحداث (Event Listeners) والاتصالات المستمرة عند عدم الحاجة إليها لتجنب استهلاك موارد المتصفح.
- **الاستدعاء النبيل (Noble Summoning):** إذا طلب المستخدم تطبيقاً عالمياً معروفاً (واتساب، يوتيوب، فيسبوك)، احترم حقوق الملكية ولا تقلده. **يجب عليك توليد كود HTML يحتوي على سكربت يقوم بتوجيه المستخدم فوراً** باستخدام \`window.top.location.href = "رابط الموقع"\` (استخدم window.top لتجاوز حماية الـ iframe). لا تضع أي نصوص أو شاشات تحميل داخل الـ HTML، فقط سكربت التوجيه.
- **قانون التجسد المثالي (Flawless Embodiment):** يجب أن تكون التطبيقات الناتجة كاملة، وظيفية، ومبهرة بصرياً ولا تبدو كمسودات أو تصاميم مشوهة. لكي تحقق ذلك: **يسمح بل ويجب** استخدام (Tailwind CSS) عبر الرابط \`<script src="https://cdn.tailwindcss.com"></script>\`، واستخدام خطوط احترافية (مثل Cairo أو Tajawal من Google Fonts)، واستخدام أيقونات (مثل FontAwesome). 
- **اكتمال الوظائف (Functional Completeness):** لا تبني واجهات فارغة عديمة الفائدة! إذا كان التطبيق مفكرة، يجب أن يضيف ويحذف ويعدل. إذا كان أداة، يجب أن تعمل برمجياً بنسبة 100% عبر JavaScript مدمج بقوة وذكاء.
- لا ترسم أو تصمم أي شيء وهمي دون استخدام الأداة وتحديد isSimulation=true.
- قدم إجابات واضحة ومفصلة في الدردشة العادية للأسئلة الأخرى.`;

    if (customInstructions && customInstructions.trim() !== '') {
      finalSystemInstruction += `\n\n--- تعليمات المستخدم الخاصة (أولوية قصوى) ---\n${customInstructions}`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        tools: [{ functionDeclarations: [transformDeclaration] }],
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        for (const call of chunk.functionCalls) {
          if (call.name === "transformIntoApp") {
            yield { type: 'transform', data: call.args as unknown as AppTransformData };
          }
        }
      }
      if (chunk.text) {
        yield { type: 'text', text: chunk.text };
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}



