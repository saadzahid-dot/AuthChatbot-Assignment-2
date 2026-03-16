<script lang="ts">
	let { value = $bindable(''), onsubmit, disabled = false } = $props<{
		value: string;
		onsubmit: () => void;
		disabled?: boolean;
	}>();

	let textarea: HTMLTextAreaElement;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onsubmit();
		}
	}

	$effect(() => {
		// Track value to re-run on input changes
		void value;
		if (textarea) {
			textarea.style.height = 'auto';
			const maxHeight = 150;
			if (textarea.scrollHeight > maxHeight) {
				textarea.style.height = maxHeight + 'px';
				textarea.style.overflowY = 'auto';
			} else {
				textarea.style.height = textarea.scrollHeight + 'px';
				textarea.style.overflowY = 'hidden';
			}
		}
	});
</script>

<form
	onsubmit={(e) => { e.preventDefault(); onsubmit(); }}
	class="flex gap-3"
>
	<div class="flex-1 relative">
		<textarea
			bind:this={textarea}
			bind:value
			onkeydown={handleKeydown}
			{disabled}
			rows="1"
			placeholder="Type your message..."
			class="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-amber-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
		></textarea>
	</div>
	<button
		type="submit"
		{disabled}
		class="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
	>
		{#if disabled}
			<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
		{:else}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
			</svg>
		{/if}
	</button>
</form>
