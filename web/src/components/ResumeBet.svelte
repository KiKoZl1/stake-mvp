<script lang="ts">
	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	onMount(() => {
		if (stateBet.lastBet?.active && stateBet.lastBet.mode) {
			stateBet.activeBetModeKey = stateBet.lastBet.mode;
		}
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});
</script>
