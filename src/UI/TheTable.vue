<template>
  <div class="the_table">
    <p style="margin: 0;"> {{props.label}} </p>
    <table>
      <thead>
        <tr class="the_table-row the_table-header">
          <th class="the_table-cell the_table-header" v-for="(column) in props.columns" :key="column">
            {{column.caption}}
          </th>
        </tr>
      </thead>
      <tbody :style="{height: props.h}">
        <tr class="the_table-row" v-for="(row, index) in props.data" :key="row" @click="rowSelect(row)">
          <td class="the_table-cell" v-for="(column, index) in props.columns" :key="column" nowrap>
            <div style="display: flex;">
              {{column?.display ?
                column.display(row) :
                (row[column.name] ? row[column.name] : '')}}
              <p @click="rowHoverClick(row)" :style="{paddingLeft: props.rowHoverText ? '0.5rem' : '0'}"
                 class="the_table-row-hover_text">{{props.rowHoverText}}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const emit = defineEmits(['selectRow', 'rowHoverClick'])
const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  rowHoverText: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  h: {
    type: String,
    default: '50rem'
  }
})
function rowSelect(row) {
  emit('selectRow', row);
}
function rowHoverClick(row) {
  emit('rowHoverClick', row);
}
</script>

<style scoped>
tbody {
  display: block;
  overflow: scroll;
}
tbody {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
tbody::-webkit-scrollbar {
  display: none;
}
thead, tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;/* even columns width , fix width of table too*/
}
.the_table {
  width: 100%;
}
.the_table table {
  width: 100%;
  border-spacing: 0;
  border: 1px #525252 solid;
}
table tr:last-child td {
  border-bottom: none;
}
tr td:last-child{
  border-right: none;
}
tr th:last-child{
  border-right: none;
}
.the_table-cell {
  border-right: 1px #525252 solid;
  border-bottom: 1px #525252 solid;
  border-collapse: collapse;
  padding: 0 0 0 1rem;
}
tr:hover {
  background: rgba(140, 199, 253, 0.22);
}
.the_table-row-hover_text {
  margin: 0;
  color: dimgray;
  visibility: hidden;
  cursor: pointer;
}
tr:hover .the_table-row-hover_text {
  visibility: visible;
}
tr.the_table-header:hover {
  background: none;
}
</style>