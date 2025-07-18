<template>
  <div>
    <font-awesome-icon v-if="sportIcon" :icon="sportIcon" />
    <span style="margin-left: 5px">{{ getValueToDisplay() }}</span>
  </div>
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import { computed } from 'vue';
import { 
  faPersonSwimming, 
  faPersonRunning, 
  faPersonBiking, 
  faPersonSkiing 
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  params: ICellRendererParams;
}

const props = defineProps<Props>();

const sportIconMap = {
  Swimming: faPersonSwimming,
  Gymnastics: faPersonRunning,
  Cycling: faPersonBiking,
  'Ski Jumping': faPersonSkiing,
};

const sportIcon = computed(() => {
  return props.params.value ? sportIconMap[props.params.value as keyof typeof sportIconMap] : null;
});

const getValueToDisplay = () => {
  return props.params.valueFormatted || props.params.value;
};
</script>