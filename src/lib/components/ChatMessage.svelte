<script lang="ts">
	import { marked } from 'marked';

	let { role, content, userName, userImage } = $props<{
		role: 'user' | 'assistant';
		content: string;
		userName?: string | null;
		userImage?: string | null;
	}>();

	const isUser = $derived(role === 'user');

	const renderedContent = $derived.by(() => {
		if (isUser) return '';
		marked.setOptions({
			gfm: true,
			breaks: true
		});
		return marked.parse(content) as string;
	});
</script>

<div class="flex {isUser ? 'justify-end' : 'justify-start'} animate-fade-in">
	<div class="flex items-start gap-2.5 {isUser ? 'flex-row-reverse max-w-[75%]' : 'max-w-[90%] lg:max-w-[75%]'}">
		<!-- Avatar -->
		{#if isUser}
			{#if userImage}
				<img src={userImage} alt="You" class="w-7 h-7 rounded-full ring-2 ring-blue-500/30 flex-shrink-0 mt-0.5" />
			{:else}
				<div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
					{userName?.[0]?.toUpperCase() || '?'}
				</div>
			{/if}
		{:else}
			<div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 mt-0.5">
				<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 00-.659 1.59v.06c0 .98-.627 1.85-1.559 2.16l-.38.127a4.072 4.072 0 01-3.864-.63l-.036-.027a1.493 1.493 0 00-1.765-.016l-.591.395A2.005 2.005 0 015 19.191V17.56a2.25 2.25 0 00-.659-1.591L2 13.5" />
				</svg>
			</div>
		{/if}

		<!-- Message bubble -->
		{#if isUser}
			<div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
				<p class="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
			</div>
		{:else}
			<div class="glass-card rounded-2xl rounded-tl-sm text-gray-800 dark:text-gray-200 px-4 py-2.5 shadow-sm min-w-0">
				<div class="prose prose-sm dark:prose-invert max-w-none break-words overflow-x-auto">
					{@html renderedContent}
				</div>
			</div>
		{/if}
	</div>
</div>
