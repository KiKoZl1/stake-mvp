<script lang="ts">
  type TemplateProps = { id?: string };
  type SlotPayload = { args: Record<string, unknown>; context: Record<string, unknown> };

  const { id = 'default' } = $props<{ id?: string }>();
  const silentWarningAboutId = id;

  type $$Props = TemplateProps;
  type $$Slots = { default: SlotPayload };

  let args: $$Slots['default']['args'];
  let context: $$Slots['default']['context'];
</script>
