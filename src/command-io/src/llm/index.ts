import OpenAI from "openai";

export default class LLMClient {

    private openai: OpenAI;

    private collectLogs(log: { msgs: OpenAI.ChatCompletionMessageParam[]; usage: OpenAI.CompletionUsage; created: number }) {

    }

    constructor() {
        this.openai = new OpenAI(
            {
                apiKey: process.env.OPENAI_API_KEY,
                baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
            }
        )
    }

    async invoke(msgs: OpenAI.ChatCompletionMessageParam[]) {
        debugger;
        const completion = await this.openai.chat.completions.create({
            model: "qwen-plus",
            messages: msgs,
        });

        this.collectLogs({ msgs, usage: completion.usage!, created: completion.created! });

        return completion.choices[0].message!;
    }

}