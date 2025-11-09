<script lang="ts">
  import type { Slots, TemplateProps } from '../legacy-types.d.ts';

  const { id = 'default' } = $props<{ id?: string }>();
  const silentWarningAboutId = id;

  type $$Props = TemplateProps;
  type $$Slots = Slots;

  let args: $$Slots['default']['args'];
  let context: $$Slots['default']['context'];
</script>

<slot {context} {args} />
