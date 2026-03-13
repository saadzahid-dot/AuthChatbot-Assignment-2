<script lang="ts">
	import type { PageData } from './$types';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';

	let { data } = $props<{ data: PageData }>();

	type Message = { id: string; role: 'user' | 'assistant'; content: string };

	let messages = $state<Message[]>([]);
	let input = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let provider = $state<'openai' | 'gemini'>('gemini');
	let isClearing = $state(false);
	let chatContainer: HTMLDivElement;

	const user = $derived(data.session?.user);

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	$effect(() => {
		messages;
		scrollToBottom();
	});

	function clearChat() {
		isClearing = true;
		error = null;
		setTimeout(() => {
			messages = [];
			isClearing = false;
		}, 400);
	}

	async function handleSubmit() {
		if (!input.trim() || isLoading) return;

		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: input.trim()
		};

		messages = [...messages, userMessage];
		input = '';
		isLoading = true;
		error = null;

		const assistantMessage: Message = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: ''
		};
		messages = [...messages, assistantMessage];

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					provider,
					messages: messages
						.filter((m) => m.id !== assistantMessage.id)
						.map(({ role, content }) => ({ role, content }))
				})
			});

			if (!response.ok) {
				throw new Error(response.status === 401 ? 'Please sign in to use chat.' : 'Failed to get response. Please try again.');
			}

			if (!response.body) throw new Error('No response body');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				messages = messages.map((m) =>
					m.id === assistantMessage.id
						? { ...m, content: m.content + chunk }
						: m
				);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			messages = messages.filter((m) => m.id !== assistantMessage.id);
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>AI Chat - AuthApp</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
	<!-- Chat Container Card -->
	<div class="glass-card rounded-2xl overflow-hidden flex flex-col h-[calc(100dvh-8rem)] animate-slide-up">
		<!-- Chat Header -->
		<div class="border-b border-gray-200 dark:border-gray-700/50 px-4 sm:px-5 py-3 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/90">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
					<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				<div>
					<h1 class="text-base font-bold text-gray-900 dark:text-white">AI Chat</h1>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{provider === 'openai' ? 'GPT-5 Mini' : 'Gemini 2.5 Flash'}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<select
					bind:value={provider}
					disabled={isLoading}
					class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
				>
					<option value="openai">GPT-5 Mini</option>
					<option value="gemini">Gemini 2.5 Flash</option>
				</select>
				{#if messages.length > 0}
					<button
						onclick={clearChat}
						class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-all"
					>
						Clear
					</button>
				{/if}
			</div>
		</div>

		<!-- Messages Area -->
		<div bind:this={chatContainer} class="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5 bg-amber-50/30 dark:bg-gray-900/30 {isClearing ? 'chat-clearing' : ''}">
			{#if messages.length === 0}
				<!-- Empty State -->
				<div class="flex flex-col items-center justify-center h-full text-center">
					<div class="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-orange-500/10 dark:from-blue-500/20 dark:to-orange-500/20 rounded-2xl flex items-center justify-center mb-5">
						<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Start a Conversation</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
						Ask me anything! I can help with questions, writing, coding, and more.
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md w-full">
						<button
							onclick={() => { input = 'Explain how authentication works in web apps'; handleSubmit(); }}
							class="text-left text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
						>
							<span class="font-medium text-blue-600 dark:text-blue-400">Explain</span> how authentication works in web apps
						</button>
						<button
							onclick={() => { input = 'What are the best practices for password security?'; handleSubmit(); }}
							class="text-left text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
						>
							<span class="font-medium text-orange-600 dark:text-orange-400">Best practices</span> for password security
						</button>
						<button
							onclick={() => { input = 'Help me write a TypeScript function to validate email addresses'; handleSubmit(); }}
							class="text-left text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
						>
							<span class="font-medium text-blue-600 dark:text-blue-400">Write</span> a TypeScript email validator
						</button>
						<button
							onclick={() => { input = 'What is the difference between OAuth and JWT?'; handleSubmit(); }}
							class="text-left text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
						>
							<span class="font-medium text-orange-600 dark:text-orange-400">Compare</span> OAuth vs JWT
						</button>
					</div>
				</div>
			{/if}

			{#each messages as message (message.id)}
				{#if message.role === 'assistant' && message.content === '' && isLoading}
					<!-- Typing indicator -->
					<div class="flex justify-start animate-fade-in">
						<div class="flex items-start gap-2.5 max-w-[75%]">
							<div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 mt-0.5">
								<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 00-.659 1.59v.06c0 .98-.627 1.85-1.559 2.16l-.38.127a4.072 4.072 0 01-3.864-.63l-.036-.027a1.493 1.493 0 00-1.765-.016l-.591.395A2.005 2.005 0 015 19.191V17.56a2.25 2.25 0 00-.659-1.591L2 13.5" />
								</svg>
							</div>
							<div class="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 dark:border-gray-700/50">
								<div class="flex items-center gap-1.5">
									<span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
									<span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
									<span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<ChatMessage
						role={message.role}
						content={message.content}
						userName={user?.name}
						userImage={user?.image}
					/>
				{/if}
			{/each}

			<!-- Error -->
			{#if error}
				<div class="animate-scale-in flex justify-center">
					<div class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl p-4 border border-red-200 dark:border-red-800 flex items-center gap-3 max-w-md">
						<div class="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<span>{error}</span>
						<button aria-label="Dismiss error" onclick={() => error = null} class="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/90 px-4 sm:px-5 py-3">
			<ChatInput bind:value={input} onsubmit={handleSubmit} disabled={isLoading} />
			<p class="text-xs text-gray-400 dark:text-gray-500 text-center mt-1.5">
				Press Enter to send, Shift+Enter for new line
			</p>
		</div>
	</div>
</div>
