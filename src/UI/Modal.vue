<template>
  <transition name="modal" id="modal" v-show="props.modelValue">
    <div class="modal-mask" :class="{close: !props.modelValue}">
      <div class="modal-wrapper">
        <div class="modal-container" :class="theme">
          <div class="modal-header">
            <slot name="header">
              <div class="modal-default_header">
                <h3>{{props.title}}</h3>
                <button class="modal-close" @click="close">x</button>
              </div>
            </slot>
          </div>
          <div class="modal-body">
            <slot name="default">
              default body
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">

            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import {inject, onMounted, onUnmounted, ref} from "vue";

const layer = ++window.layerCount;
const emit = defineEmits(['close', 'update:modelValue'])
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})
const theme = ref(inject('theme'))
onMounted(() => {
  // console.log(layer)
  if (layer === 1)
    window.addEventListener('keyup', onKeyUp);
})
onUnmounted(() => {
  if (layer === 1)
    window.removeEventListener('keyup', onKeyUp);
})
function close() {
  emit('close');
  emit('update:modelValue', false);
  setTimeout(() => window.layerCount--, 200);
}
function onKeyUp(event) {
  if (event.key === 'Escape' && layer === window.layerCount) {
    close();
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: all 0.3s ease;
}
.modal-mask.close{
  background-color: unset;
}
.modal-default_header {
  display: flex;
  justify-content: space-between;
  border-bottom: #525252 1px solid;
  padding: 0.5rem;
}
.modal-close {
  border-radius: 1rem;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
  max-height: 80vh;
}

.modal-container {
  min-height: 0;
  width: fit-content;
  margin: auto;
  border: #036010E5 1px solid;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
  max-height: 80vh;
  background: #525252;
}

.modal-header h3 {
  margin-top: 0;

  margin-block-end: 0;
}

.modal-body {
  margin: 1rem;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}

</style>