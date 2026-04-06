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

export async function* streamMessage(message: string, history: ChatMessage[] = []) {
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

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction: `أنت مساعد ذكي ومفيد باللغة العربية. اسمك 'المتحول' (Mystique). 
لديك قدرة خارقة على التحول إلى أي تطبيق يطلبه المستخدم.
عندما يطلب منك المستخدم التحول إلى تطبيق (مثل: "تحول إلى آلة حاسبة"، "كن تطبيق طقس"، "استنسخ واتساب"):
يجب عليك استخدام أداة 'transformIntoApp' حصراً لتوليد كود التطبيق والتحول إليه.
لا تقم بكتابة كود التطبيق في نص الدردشة العادي.
- إذا كان التطبيق بسيطاً (آلة حاسبة، لعبة بسيطة، ساعة، مفكرة): اجعله يعمل بالكامل (isSimulation: false).
- **هام جداً لحفظ البيانات:** إذا كان التطبيق يحتاج لحفظ بيانات (مثل المفكرة، قائمة المهام)، يجب عليك كتابة كود JavaScript داخل التطبيق يستخدم \`localStorage\` لحفظ واسترجاع البيانات. هذا يضمن عدم فقدان المستخدم لبياناته عند إغلاق التطبيق.
- إذا كان التطبيق معقداً (واتساب، يوتيوب، تويتر): قم ببناء واجهة مستخدم مشابهة جداً (UI Clone) واجعل (isSimulation: true).
- **هام جداً للعمل دون اتصال (Offline):** ممنوع استخدام أي روابط خارجية (CDNs) للخطوط أو CSS (مثل Tailwind) أو JavaScript. اكتب كل التنسيقات (CSS) برمجياً داخل ملف الـ HTML باستخدام وسوم <style> لضمان عمل التطبيق دون اتصال بالإنترنت. اجعل التصميم عصرياً واحترافياً باستخدام CSS الحديث.
- لا ترسم أو تصمم أي شيء وهمي دون استخدام الأداة وتحديد isSimulation=true.
- قدم إجابات واضحة ومفصلة في الدردشة العادية للأسئلة الأخرى.`,
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



