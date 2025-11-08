<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';
</script>

{#if stateModal.modal?.name === 'forceResult'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>forceResult</Popup>
{/if}
