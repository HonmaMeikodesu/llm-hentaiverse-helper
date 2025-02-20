import OpenAI from "openai";

type BeforeInvokeHook = (
    msgs: OpenAI.ChatCompletionMessageParam[]
) => Promise<void>;

type AfterInvokeHook = (completions: OpenAI.ChatCompletion) => Promise<void>;

type OnInvokeErrorHook = (reason: any) => Promise<void>;

export default class LLMClient {
    private openai: OpenAI;

    private beforeInvokeHook?: BeforeInvokeHook;

    private afterInvokeHook?: AfterInvokeHook;

    private onInvokeErrorHook?: OnInvokeErrorHook;

    constructor(hooks?: {
        beforeInvoke?: BeforeInvokeHook;
        afterInvoke?: AfterInvokeHook;
        onInvokeError?: OnInvokeErrorHook;
    }) {
        const { beforeInvoke, afterInvoke, onInvokeError } = hooks || {};

        this.beforeInvokeHook = beforeInvoke;
        this.afterInvokeHook = afterInvoke;
        this.onInvokeErrorHook = onInvokeError;

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        });
    }

    invoke = async (msgs: OpenAI.ChatCompletionMessageParam[]) => {
        await (this.beforeInvokeHook && this.beforeInvokeHook(msgs));
        const completion = await this.openai.chat.completions.create({
            model: "qwen-plus",
            messages: msgs,
        });

        try {
            await (this.afterInvokeHook && this.afterInvokeHook(completion));

            return completion.choices[0].message!;
        } catch (e) {
            await (this.onInvokeErrorHook && this.onInvokeErrorHook(e));
        }
    }
}
