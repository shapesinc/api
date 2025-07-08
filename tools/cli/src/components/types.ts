import type OpenAI from "openai";

export interface QueuedImage {
    dataUrl: string;
    filename: string;
    size: number;
}

export interface Message {
    type: "user" | "assistant" | "system" | "tool" | "error";
    content: string;
    images?: string[];
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
    tool_call_id?: string;
    display_name?: string;
    streaming?: boolean;
}
