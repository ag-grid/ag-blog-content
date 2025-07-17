<template>
  <div>
    <font-awesome-icon :icon="sportIconMap[params.value]" />
    <span style="margin-left: 5px">{{ getValueToDisplay() }}</span>
  </div>
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';

interface Props {
  params: ICellRendererParams;
}

const props = defineProps<Props>();

const sportIconMap: Record<string, string> = {
  Swimming: 'person-swimming',
  Gymnastics: 'person-running',
  Cycling: 'person-biking',
  'Ski Jumping': 'person-skiing',
};

const getValueToDisplay = () => {
  return props.params.valueFormatted || props.params.value;
};
</script>