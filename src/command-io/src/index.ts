import OpenAI from "openai";
import initPromopt from "../../prompt-builder/src/context-init/index.js";

try {
    const openai = new OpenAI(
        {
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        }
    );
    const { systemInit, evaluate } = initPromopt();
    const completion = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
            { role: "system", content: systemInit },
            { role: "user", content: evaluate}
        ],
    });
    console.log(completion.choices[0].message.content);
} catch (error) {
    console.log(`错误信息：${error}`);
}