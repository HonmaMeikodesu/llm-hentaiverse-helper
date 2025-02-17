import OpenAI from "openai";

export default class LLMClient {
    private openai: OpenAI;

    private beforeInvokeHook: (
        msgs: OpenAI.ChatCompletionMessageParam[]
    ) => Promise<void>;

    private afterInvokeHook?: (
        completions: OpenAI.ChatCompletion
    ) => Promise<void>;

    private onInvokeErrorHook?: (reason: any) => Promise<void>;

    constructor(hooks?: { beforeInvoke?: typeof this.beforeInvokeHook, afterInvoke?: typeof this.afterInvokeHook, onInvokeError?: typeof this.onInvokeErrorHook }) {
        
        const { beforeInvoke, afterInvoke, onInvokeError } = hooks || {};

        this.beforeInvokeHook = beforeInvoke;
        this.afterInvokeHook = afterInvoke;
        this.onInvokeErrorHook = onInvokeError;

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        });
    }

    async invoke(msgs: OpenAI.ChatCompletionMessageParam[]) {
        await ( this.beforeInvokeHook && this.beforeInvokeHook(msgs) );
        const completion = await this.openai.chat.completions.create({
            model: "qwen-plus",
            messages: msgs,
        });

        try {

        await (this.afterInvokeHook && this.afterInvokeHook(completion));

        return completion.choices[0].message!;
        } catch(e) {
            await ( this.onInvokeErrorHook && this.onInvokeErrorHook(e) );
        }

    }
}
