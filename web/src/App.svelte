<script lang="ts">
  import { GlobalStyle } from 'components-ui-html';
  import { Authenticate, LoaderStakeEngine, LoaderExample, LoadI18n } from 'components-shared';
  import Game from './components/Game.svelte';
  import { setContext } from './game/context';
  import messagesMap from './i18n/messagesMap';

  setContext();

  const loaderStakeEngineSrc = new URL('./assets/stake-engine-loader.gif', import.meta.url).href;
  const loaderSrc = new URL('./assets/loader.gif', import.meta.url).href;

  let showYourLoader = $state(false);
</script>

<GlobalStyle>
  <Authenticate>
    <LoadI18n {messagesMap}>
      <Game />
    </LoadI18n>
  </Authenticate>
</GlobalStyle>

<LoaderStakeEngine src={loaderStakeEngineSrc} oncomplete={() => (showYourLoader = true)} />

{#if showYourLoader}
  <LoaderExample src={loaderSrc} />
{/if}
