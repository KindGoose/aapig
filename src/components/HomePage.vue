<template>
  <div class="generation_page">
    <div class="generation_page-column">
      <h4> Режим: </h4>
      <div class="generation_page-mode-buttons">
        <button class="secondary-button" @click="changeMode(1)"
                :class="{active: generatorMode === 1}">API</button>
        <button class="secondary-button" @click="changeMode(2)"
                :class="{active: generatorMode === 2}">Модель</button>
        <button class="secondary-button" @click="changeMode(3)"
                :class="{active: generatorMode === 3}">Справочники</button>
      </div>
      <h5> {{ infobuttonsTitle }}</h5>
      <div class="generation_page-api_info-buttons">
        <button v-for="(info, index) in infoList" :key="index"
                class="secondary-button"
                @click="infobuttonClick(info)"
                :class="{active: currentInfoName === index}"
        >{{ index }}</button>
      </div>
      <label>Код для генерации</label>
      <textarea v-model="code" @input="currentInfoName = ''"/>
      <button v-if="generatorMode === 1" @click="generateApi">Сгенерировать API</button>
      <button v-if="generatorMode === 2" disabled>Сгенерировать модель (в разработке)</button>
      <button v-if="generatorMode === 3" @click="generateRefbook">Сгенерировать справочники</button>
    </div>
    <div class="generation_page-row">
      <div class="generation_page-text_area">
        <label>Сгенерированный код</label>
        <textarea style="width:100%" v-model="generatedCode"/>
      </div>
      <div class="generation_page-text_area">
        <label>Отсортированная информация</label>
        <textarea v-model="sortedInfo"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import {computed, Ref, ref} from "vue";
import {
  ApiInfoList,
  generateApiForList,
  getImport as getApiImport,
  getGeneratedMethods,
  clearGeneratedMethods,
  sortApiInfo,
  getSortedApiInfo
} from "../generators/ApiGenerator.ts";
import {
  generateRefbookFromList,
  getImport as getRefbookImport,
  getGeneratedRefbook,
  RefbookInfoList
} from "..//generators/RefbookGenerator";
import {getAllInfo} from '../assets/js/FileWorker';

interface ApiInfoForGeneration {
  [key: string]: ApiInfoList;
}
interface RefbookInfoForGeneration {
  [key: string]: RefbookInfoList;
}
interface allInfo {
  api: ApiInfoForGeneration;
  refbook: RefbookInfoForGeneration;
}

const allApiInfo: Ref<ApiInfoForGeneration> = ref({});
const allRefbookInfo: Ref<RefbookInfoForGeneration> = ref({});

const code: Ref<string> = ref('');
const generatedCode: Ref<string> = ref('');
const sortedInfo: Ref<string> = ref('');
const currentInfoName: Ref<string> = ref('');
const generatorMode: Ref<number> = ref(0);

const infoList = computed(():ApiInfoForGeneration|RefbookInfoForGeneration => {
  switch(generatorMode.value) {
    case 0: return {};
    case 1: return allApiInfo.value;
    case 2: return {};
    case 3: return allRefbookInfo.value;
    default: return {};
  }
})
const infobuttonClick = computed((): Function => {
  switch(generatorMode.value) {
    case 0: return ()=>console.log('Загрузка')
    case 1: return getApiInfo;
    case 2: return ()=>console.log('indev');
    case 3: return getRefbookInfo;
    default: return ()=>console.log('no such function');
  }
})
const infobuttonsTitle = computed((): string => {
  switch(generatorMode.value) {
    case 0: return 'Загрузка...';
    case 1: return 'ApiInfo из проекта: ';
    case 2: return 'ModelsInfo из проекта: ';
    case 3: return 'RefbookInfo из проекта: ';
    default: return '??? из проекта: ';
  }
})
getAllInfo().then((allInfoFileNames: allInfo) => {
  if (allInfoFileNames?.api) {
    allApiInfo.value = allInfoFileNames.api;
  }
  if (allInfoFileNames?.refbook) {
    allRefbookInfo.value = allInfoFileNames.refbook;
  }
})
function setDefaultApiInfo() {
  const aifg: ApiInfoForGeneration | undefined = allApiInfo.value['По умолчанию'];
  if (aifg !== undefined)
    getApiInfo(aifg);
}
function setDefaultRefbookInfo() {
  const rifg: RefbookInfoForGeneration | undefined = allRefbookInfo.value['По умолчанию'];
  if (rifg !== undefined)
    getRefbookInfo(rifg);
}

function changeMode(mode: number): void {
  generatorMode.value = mode;
  switch (mode) {
    case 1:
      setDefaultApiInfo();
      break;
    case 2:
      code.value = '';
      currentInfoName.value = '';
      break;
    case 3:
      setDefaultRefbookInfo();
      break;
    default:
      new Error('Режима с кодом "' + String(mode) + '" не существует!');
  }
}

function generateApi(): void {
  clearGeneratedMethods();
  let apiInfo: ApiInfoList = JSON.parse(code.value);
  apiInfo = sortApiInfo(apiInfo);
  sortedInfo.value = getSortedApiInfo();
  generateApiForList(apiInfo);
  generatedCode.value = getApiImport() + '\n\n' + getGeneratedMethods();
}

function generateRefbook() {
  let refbookInfo: RefbookInfoList = JSON.parse(code.value);
  generateRefbookFromList(refbookInfo);
  generatedCode.value = getRefbookImport() + '\n\n' + getGeneratedRefbook();
}

function getApiInfo(aifg: ApiInfoForGeneration, name: string): void {
  clearGeneratedMethods();
  code.value = JSON.stringify(aifg);
  currentInfoName.value = name;
}

function getRefbookInfo(rifg: RefbookInfoForGeneration, name: string): void {
  code.value = JSON.stringify(rifg);
  currentInfoName.value = name;
}
</script>
<style>
/* Drawer fix width */
.generation_page-instruction {
  max-width: 1000px !important;
  height: 100%;
  width: 70%;
}
.generation_page-instruction .p-3 {
  height: 100%;
  padding: 0 1rem !important;
}
.generation_page-instruction .p-3.flex{
  height: 2rem;
}
.generation_page-instruction .p-3.flex p.text-lg\/6{
  margin: 0.25rem !important;
}
.secondary-button.active {
  background: rgba(122, 122, 255, 0.15);
}
</style>
<style scoped>
@import "../assets/css/GeneratorInterfaceStyle.css";
</style>