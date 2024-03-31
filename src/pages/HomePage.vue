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
      <div v-if="Object.keys(infoList)?.length" class="generation_page-api_info-buttons">
        <button v-for="(info, index) in infoList" :key="index"
                class="secondary-button"
                @click="infobuttonClick(info, index)"
                :class="{active: currentInfoName === index}"
        >{{ index }}</button>
      </div>
      <div v-else>
        Данные не обнаружены
      </div>
      <h5> Действия </h5>
      <div class="generation_page-api_info-buttons">
        <button class="secondary-button" @click="createAction()" disabled>Добавить (в разработке)</button>
        <button class="secondary-button" @click="infoListMode = (infoListMode + 1)%2">
          {{infoListMode === 0 ? 'Список' : 'Код'}}
        </button>
      </div>
      <div v-if="infoListMode === 0">
        <label>Код для генерации</label>
        <textarea style="width: 90vw; max-width: 90vw" v-model="code" @input="currentInfoName = ''"/>
      </div>
      <div v-else-if="infoListMode === 1">
        <TheTable :data="infoArray" :columns="[
            {
              name: 'Name',
              caption: 'Название'
            },
            {
              name: 'ViewUrl',
              caption: 'url'
            }
        ]" h="20rem"/>
      </div>
      <button v-if="generatorMode === 1" @click="generateApi">Сгенерировать API</button>
      <button v-if="generatorMode === 2" disabled>Сгенерировать модель (в разработке)</button>
      <button v-if="generatorMode === 3" @click="generateRefbook">Сгенерировать справочники</button>
    </div>
    <div class="generation_page-row">
      <div class="generation_page-text_area">
        <label>Сгенерированный код</label>
        <textarea style="width: 45vw; max-width: 45vw" v-model="generatedCode"/>
      </div>
      <div class="generation_page-text_area">
        <label>Отсортированная информация</label>
        <textarea style="width: 45vw; max-width: 45vw" v-model="sortedInfo" />
      </div>
    </div>

    <Modal v-model="createModalVisible" :title="createModalTitle">
      <div>

      </div>
    </Modal>
  </div>
</template>

<script setup>

import {computed, ref} from "vue";
import {
  generateApiForList,
  getImport as getApiImport,
  getGeneratedMethods,
  clearGeneratedMethods,
  sortApiInfo,
  getSortedApiInfo
} from "../generators/ApiGenerator.js";
import {
  generateRefbookFromList,
  getImport as getRefbookImport,
  getGeneratedRefbook
} from "../generators/RefbookGenerator.js";
import {getAllInfo, writeApi} from '../assets/js/FileWorker.js';
import Modal from "../UI/Modal.vue";
import TheTable from "../UI/TheTable.vue";

const allApiInfo = ref({});
const allRefbookInfo = ref({});

const code= ref('');
const generatedCode = ref('');
const sortedInfo = ref('');
const currentInfoName = ref('');
const generatorMode = ref(0);

const infoListMode = ref(1);
const createModalVisible = ref(false);

const infoList = computed(() => {
  switch(generatorMode.value) {
    case 0: return {};
    case 1: return allApiInfo.value;
    case 2: return {};
    case 3: return allRefbookInfo.value;
    case 4: return {};
    default: return {};
  }
})

const infoArray = computed(() => {
  const result = [];
  const source = infoList.value[currentInfoName.value]?.info;
  if (source) {
    for (let af in source) {
      /***/
      let url = source[af]?.url??(typeof source[af] === 'string' ? source[af] : 'unknown')
      result.push({Name: af, ViewUrl: url});
    }
  }
  return result;
})
const infobuttonClick = computed(() => {
  switch(generatorMode.value) {
    case 0: return ()=>console.log('Загрузка')
    case 1: return getApiInfo;
    case 2: return ()=>console.log('indev');
    case 3: return getRefbookInfo;
    case 4: return ()=>console.error('Данные не обнаружены');
    default: return ()=>console.log('no such function');
  }
})
const infobuttonsTitle = computed(() => {
  switch(generatorMode.value) {
    case 0: return 'Загрузка...';
    case 1: return 'ApiInfo из проекта: ';
    case 2: return 'ModelsInfo из проекта: ';
    case 3: return 'RefbookInfo из проекта: ';
    case 4: return 'Данные не обнаружены!';
    default: return '??? из проекта: ';
  }
})
const createModalTitle = computed(() => {
  switch(generatorMode.value) {
    case 0: return 'Загрузка...';
    case 1: return 'Создать Api';
    case 2: return 'В разработке';
    case 3: return 'Создать Refbook';
    case 4: return 'Данные не обнаружены!';
    default: return '???';
  }
})
const createAction = computed(() => {
  switch(generatorMode.value) {
    case 0: return ()=>console.log('Загрузка')
    case 1: return showCreateApi;
    case 2: return ()=>console.log('indev');
    case 3: return showCreateRefbook;
    case 4: return ()=>console.error('Данные не обнаружены');
    default: return ()=>console.log('no such function');
  }
})
getAllInfo().then((allInfoFileNames) => {
  if (allInfoFileNames?.api) {
    allApiInfo.value = allInfoFileNames.api;
  }
  if (allInfoFileNames?.refbook) {
    allRefbookInfo.value = allInfoFileNames.refbook;
  }
  generatorMode.value = 1;
  setDefaultApiInfo();
})
function showCreateApi() {
  createModalVisible.value = true;
}
function showCreateRefbook() {
  createModalVisible.value = true;
}
function setDefaultApiInfo() {
  const aifg = allApiInfo.value['По умолчанию'];
  // console.log(aifg)
  if (aifg !== undefined)
    getApiInfo(aifg, 'По умолчанию');
}
function setDefaultRefbookInfo() {
  const rifg = allRefbookInfo.value['По умолчанию'];
  if (rifg !== undefined)
    getRefbookInfo(rifg, 'По умолчанию');
}

function changeMode(mode) {
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

function generateApi() {
  clearGeneratedMethods();
  let apiInfo= JSON.parse(code.value);
  apiInfo = sortApiInfo(apiInfo);
  sortedInfo.value = getSortedApiInfo();
  generateApiForList(apiInfo);
  generatedCode.value = getApiImport() + '\n\n' + getGeneratedMethods();
  let path = '';
  switch (generatorMode.value) {
    case 1:
      path = allApiInfo.value[currentInfoName.value].path;
      break;
    case 2:
      path = allRefbookInfo.value[currentInfoName.value].path;
      break;
  }
  writeApi(generatedCode.value, path)
}

function generateRefbook() {
  let refbookInfo = JSON.parse(code.value);
  generateRefbookFromList(refbookInfo);
  generatedCode.value = getRefbookImport() + '\n\n' + getGeneratedRefbook();
}

function getApiInfo(aifg, name) {
  clearGeneratedMethods();
  code.value = JSON.stringify(aifg.info);
  currentInfoName.value = name;
}

function getRefbookInfo(rifg, name) {
  code.value = JSON.stringify(rifg.info);
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