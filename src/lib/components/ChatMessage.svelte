<script lang="ts">
	import { marked } from 'marked';

	let { role, content, userName, userImage } = $props<{
		role: 'user' | 'assistant';
		content: string;
		userName?: string | null;
		userImage?: string | null;
	}>();

	const isUser = $derived(role === 'user');
	let copied = $state(false);

	const langNames: Record<string, string> = {
		bash: 'Bash', sh: 'Shell', zsh: 'Zsh', powershell: 'PowerShell', cmd: 'CMD',
		python: 'Python', py: 'Python', javascript: 'JavaScript', js: 'JavaScript',
		typescript: 'TypeScript', ts: 'TypeScript', java: 'Java', cpp: 'C++', c: 'C',
		csharp: 'C#', cs: 'C#', go: 'Go', rust: 'Rust', ruby: 'Ruby', php: 'PHP',
		swift: 'Swift', kotlin: 'Kotlin', sql: 'SQL', html: 'HTML', css: 'CSS',
		json: 'JSON', yaml: 'YAML', xml: 'XML', markdown: 'Markdown', md: 'Markdown',
		plaintext: 'Code', text: 'Code', '': 'Code'
	};

	// Store code blocks for copy by index
	let codeBlocks: string[] = [];

	const renderer = new marked.Renderer();
	renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
		const language = (lang || '').trim().toLowerCase();
		const displayLang = langNames[language] || language.charAt(0).toUpperCase() + language.slice(1) || 'Code';
		const escaped = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const idx = codeBlocks.length;
		codeBlocks.push(text);
		return `<div class="code-block-wrapper">
			<div class="code-block-header">
				<span>${displayLang}</span>
				<button class="code-copy-btn" data-code-idx="${idx}" title="Copy code">
					<svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
					<svg class="check-icon" style="display:none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
				</button>
			</div>
			<pre><code class="language-${language || 'plaintext'}">${escaped}</code></pre>
		</div>`;
	};

	const renderedContent = $derived.by(() => {
		if (isUser) return '';
		// Reset code blocks for each render pass
		codeBlocks = [];
		// Close unclosed code blocks during streaming so marked can parse them
		let text = content;
		const fenceMatches = text.match(/```/g);
		if (fenceMatches && fenceMatches.length % 2 !== 0) {
			text += '\n```';
		}
		return marked.parse(text, {
			gfm: true,
			breaks: true,
			renderer
		}) as string;
	});

	function handleBubbleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const btn = target.closest('.code-copy-btn') as HTMLElement | null;
		if (btn) {
			const idx = parseInt(btn.getAttribute('data-code-idx') || '0', 10);
			const code = codeBlocks[idx] || '';
			navigator.clipboard.writeText(code);
			const copyIcon = btn.querySelector('.copy-icon') as HTMLElement;
			const checkIcon = btn.querySelector('.check-icon') as HTMLElement;
			if (copyIcon && checkIcon) {
				copyIcon.style.display = 'none';
				checkIcon.style.display = 'block';
				setTimeout(() => {
					copyIcon.style.display = 'block';
					checkIcon.style.display = 'none';
				}, 2000);
			}
		}
	}

	async function copyAll() {
		await navigator.clipboard.writeText(content);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
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
			<div class="group relative">
				<div
					class="rounded-2xl rounded-tl-sm text-gray-800 dark:text-gray-200 px-4 py-2.5 shadow-sm min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
					onclick={handleBubbleClick}
					role="presentation"
				>
					<div class="prose prose-sm dark:prose-invert max-w-none break-words overflow-x-auto">
						{@html renderedContent}
					</div>
				</div>
				<!-- Copy entire response button -->
				{#if content}
					<button
						onclick={copyAll}
						class="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 shadow-sm"
						title="Copy response"
					>
						{#if copied}
							<svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							<span class="text-green-500">Copied</span>
						{:else}
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="2" />
								<path stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
							</svg>
							<span>Copy</span>
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
