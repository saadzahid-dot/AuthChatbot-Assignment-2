<script lang="ts">
	import type { PageData } from './$types';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	import {
		type ChatNode,
		createRootNode,
		createNode,
		getDisplayPath,
		getActivePath,
		getActiveLeaf,
		findNode,
		findParent,
		navigateSibling,
		attachChild
	} from '$lib/chat';

	let { data } = $props<{ data: PageData }>();

	let root = $state<ChatNode>(createRootNode());
	let input = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let provider = $state<'openai' | 'gemini'>('gemini');
	let isClearing = $state(false);
	let chatContainer: HTMLDivElement;
	let forkTargetId = $state<string | null>(null);

	const user = $derived(data.session?.user);
	const displayPath = $derived.by(() => getDisplayPath(root));
	const hasMessages = $derived(displayPath.length > 0);

	let shouldScrollToBottom = $state(true);

	function scrollToBottom() {
		if (chatContainer && shouldScrollToBottom) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	$effect(() => {
		displayPath;
		scrollToBottom();
	});

	function clearChat() {
		isClearing = true;
		error = null;
		setTimeout(() => {
			root = createRootNode();
			forkTargetId = null;
			isClearing = false;
		}, 400);
	}

	function handleEditMessage(messageId: string, content: string) {
		if (isLoading) return;
		const parent = findParent(messageId, root);
		if (parent) {
			forkTargetId = parent.id;
			input = content;
		}
	}

	function handleNavigateSibling(nodeId: string, direction: 'prev' | 'next') {
		shouldScrollToBottom = false;
		navigateSibling(root, nodeId, direction);
	}

	async function handleSubmit() {
		if (!input.trim() || isLoading) return;

		// Determine where to attach the new message
		let attachTo: ChatNode;
		if (forkTargetId) {
			attachTo = findNode(forkTargetId, root) || getActiveLeaf(root);
			forkTargetId = null;
		} else {
			attachTo = getActiveLeaf(root);
		}

		const userNode = attachChild(attachTo, createNode('user', input.trim()));

		input = '';
		isLoading = true;
		error = null;
		shouldScrollToBottom = true;

		const assistantNodeData = createNode('assistant', '');
		const assistantNode = attachChild(userNode, assistantNodeData);

		try {
			const path = getActivePath(root);
			const history = path
				.filter((n) => n.id !== assistantNode.id)
				.map((n) => ({ role: n.role, content: n.content }));

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ provider, messages: history })
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
				assistantNode.content += chunk;
				scrollToBottom();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			userNode.children = userNode.children.filter((c) => c.id !== assistantNode.id);
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Pascal - Passly</title>
</svelte:head>

<div class="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
	<!-- Chat Container Card -->
	<div class="glass-card rounded-2xl overflow-hidden flex flex-col h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-8rem)] animate-slide-up">
		<!-- Chat Header -->
		<div class="border-b border-gray-200 dark:border-gray-700/50 px-4 sm:px-5 py-3 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/90">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
					<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="8" width="18" height="12" rx="3" /><circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" /><path d="M12 2v4" /><circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" /><path d="M1 14h2M21 14h2" />
					</svg>
				</div>
				<div>
					<h1 class="text-base font-bold text-gray-900 dark:text-white">Pascal</h1>
					<p class="text-xs text-gray-500 dark:text-gray-400">By Passly
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
				{#if hasMessages}
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
			{#if !hasMessages}
				<!-- Welcome State -->
				<div class="flex flex-col items-center justify-center h-full text-center">
					<!-- Pascal avatar -->
					<div class="w-20 h-20 bg-gradient-to-br from-violet-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-violet-500/20">
						<svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="8" width="18" height="12" rx="3" /><circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" /><path d="M12 2v4" /><circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" /><path d="M1 14h2M21 14h2" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Hey{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm <span class="text-blue-600 dark:text-blue-400">Pascal</span>
					</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-1">
						Your AI assistant, powered by Passly. I'm here to help you with anything — ask me questions, brainstorm ideas, write code, or just have a conversation.
					</p>
					<p class="text-xs text-gray-400 dark:text-gray-500 mb-7">
						Pick a topic below or type your own message to get started.
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

			{#each displayPath as { node, siblingCount, siblingIndex } (node.id)}
				{#if node.role === 'assistant' && node.content === '' && isLoading}
					<!-- Typing indicator -->
					<div class="flex justify-start animate-fade-in">
						<div class="flex items-start gap-2.5 max-w-[75%]">
							<div class="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20 mt-0.5">
								<svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="8" width="18" height="12" rx="3" /><circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" /><path d="M12 2v4" /><circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
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
						role={node.role}
						content={node.content}
						userName={user?.name}
						userImage={user?.image}
						messageId={node.id}
						onedit={handleEditMessage}
						siblingCount={siblingCount}
						siblingIndex={siblingIndex}
						onnavigate={(dir) => handleNavigateSibling(node.id, dir)}
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
			<p class="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-1.5">
				<span class="font-semibold text-blue-500/70 dark:text-blue-400/70">Passly</span><span class="mx-1 text-gray-300 dark:text-gray-600">:</span><span>Secured by</span> <span class="font-semibold text-gray-500 dark:text-gray-400">Pascal.</span>
			</p>
		</div>
	</div>
</div>
