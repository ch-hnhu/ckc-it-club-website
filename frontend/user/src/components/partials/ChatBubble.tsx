import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import { chatbotService, type ChatTurn } from "@/services/chatbot.service";
import { renderMarkdownContent } from "@/lib/markdown";

interface ChatMessage {
	role: "user" | "model";
	text: string;
}

const WELCOME: ChatMessage = {
	role: "model",
	text: "Chào bạn 👋 Mình là trợ lý ảo của CKC IT Club. Bạn muốn hỏi gì về câu lạc bộ nào?",
};

// Số lượt gần nhất gửi kèm để bot hiểu ngữ cảnh (nhớ trong phiên).
const HISTORY_LIMIT = 12;

/**
 * ChatBubble — bong bóng chat cố định góc dưới phải, mở khung hỏi đáp với chatbot CLB.
 * Lịch sử hội thoại chỉ tồn tại trong phiên (reset khi tải lại trang).
 */
const ChatBubble: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Tự cuộn xuống cuối khi có tin nhắn mới hoặc mở khung.
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [messages, isOpen]);

	useEffect(() => {
		if (isOpen) inputRef.current?.focus();
	}, [isOpen]);

	// Tự giãn chiều cao textarea theo nội dung (tối đa ~120px rồi cuộn).
	// Tạm gỡ placeholder khi đo vì Chrome tính scrollHeight theo cả placeholder.
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const placeholder = el.placeholder;
		el.placeholder = "";
		el.style.height = "auto";
		void el.offsetHeight; // ép reflow để scrollHeight phản ánh đúng nội dung
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
		el.placeholder = placeholder;
	}, [input, isOpen]);

	const sendMessage = async () => {
		const text = input.trim();
		if (!text || isLoading) return;

		const userMsg: ChatMessage = { role: "user", text };
		const history: ChatTurn[] = messages
			.filter((m) => m !== WELCOME)
			.slice(-HISTORY_LIMIT)
			.map((m) => ({ role: m.role, text: m.text }));

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsLoading(true);

		try {
			const res = await chatbotService.ask({ message: text, history });
			setMessages((prev) => [...prev, { role: "model", text: res.data.answer }]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "model",
					text: "Xin lỗi, hiện mình chưa trả lời được. Bạn vui lòng thử lại sau ít phút nhé.",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	return (
		<>
			{/* Khung chat */}
			{isOpen && (
				<div className='fixed bottom-24 right-6 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-3rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0px_#111]'>
					{/* Header */}
					<div className='flex items-center justify-between border-b-4 border-black bg-yellow-300 px-4 py-3'>
						<div className='flex items-center gap-2'>
							<span className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white'>
								<Bot className='h-5 w-5 text-black stroke-[2.5px]' />
							</span>
							<div className='leading-tight'>
								<p className='text-sm font-extrabold text-black'>
									Trợ lý CKC IT Club
								</p>
								<p className='text-[11px] font-semibold text-black/70'>
									Hỏi đáp về câu lạc bộ
								</p>
							</div>
						</div>
						<button
							type='button'
							onClick={() => setIsOpen(false)}
							className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white transition hover:bg-red-200 active:scale-90'
							aria-label='Đóng khung chat'>
							<X className='h-4 w-4 text-black stroke-[3px]' />
						</button>
					</div>

					{/* Danh sách tin nhắn */}
					<div
						ref={scrollRef}
						className='flex-1 space-y-3 overflow-y-auto bg-neutral-50 p-4'>
						{messages.map((msg, idx) => (
							<div
								key={idx}
								className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
								<div
									className={`max-w-[85%] rounded-xl border-2 border-black px-3 py-2 text-sm shadow-[2px_2px_0px_#111] ${
										msg.role === "user"
											? "bg-blue-200 text-black"
											: "bg-white text-black"
									}`}>
									{msg.role === "model" ? (
										<div
											className='chatbot-markdown break-words'
											dangerouslySetInnerHTML={{
												__html: renderMarkdownContent(msg.text),
											}}
										/>
									) : (
										<span className='whitespace-pre-wrap break-words'>
											{msg.text}
										</span>
									)}
								</div>
							</div>
						))}

						{isLoading && (
							<div className='flex justify-start'>
								<div className='flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm shadow-[2px_2px_0px_#111]'>
									<Loader2 className='h-4 w-4 animate-spin' />
									<span className='font-semibold text-black/70'>
										Đang trả lời…
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Ô nhập */}
					<div className='flex items-end gap-2 border-t-4 border-black bg-white p-3'>
						<textarea
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder='Nhập câu hỏi của bạn…'
							maxLength={2000}
							rows={1}
							className='max-h-[120px] min-h-[40px] flex-1 resize-none overflow-y-auto rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium leading-snug text-black outline-none [field-sizing:fixed] focus:border-black focus:shadow-[0_0_0_3px_#e6da35]'
						/>
						<button
							type='button'
							onClick={sendMessage}
							disabled={!input.trim() || isLoading}
							className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-yellow-300 transition hover:bg-yellow-400 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50'
							aria-label='Gửi'>
							<Send className='h-4 w-4 text-black stroke-[2.5px]' />
						</button>
					</div>
				</div>
			)}

			{/* Bong bóng bật/tắt */}
			<button
				type='button'
				onClick={() => setIsOpen((v) => !v)}
				className='fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-4 border-black bg-yellow-300 shadow-[4px_4px_0px_#111] transition-all duration-200 hover:scale-110 active:scale-90'
				aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}>
				{isOpen ? (
					<X className='h-6 w-6 text-black stroke-[3px]' />
				) : (
					<MessageCircle className='h-6 w-6 text-black stroke-[2.5px]' />
				)}
			</button>
		</>
	);
};

export default ChatBubble;
