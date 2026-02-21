<script lang="ts">
import jsonToAst from 'json-to-ast'
// @ts-expect-error no types
import { FoamTree } from '@carrotsearch/foamtree'
import { parseRootNode } from '~/parser'
import type { RootFoamGroup } from '~/parser'

export default {
  data() {
    return {
      foamTree: null as any,
      foamTreeError: '',
      inputString: '',
      showVisualization: false,
      isDraggingOver: false,
    }
  },
  mounted() {
    let timeout: number
    window.addEventListener('resize', () => {
      if (!this.foamTree)
        return

      window.clearTimeout(timeout)
      timeout = window.setTimeout(this.foamTree.resize, 300)
    })
  },
  methods: {
    onDragOver(event: DragEvent) {
      event.preventDefault()
      this.isDraggingOver = true
    },
    onDragLeave() {
      this.isDraggingOver = false
    },
    async onDrop(event: DragEvent) {
      event.preventDefault()
      this.isDraggingOver = false
      const file = event.dataTransfer?.files[0]
      if (!file || !file.name.endsWith('.sublime_session'))
        return
      this.inputString = await file.text()
      this.initFoamTree()
    },
    async initFoamTree() {
      try {
        const dataObject = parseRootNode(jsonToAst(this.inputString, { loc: true }))
        this.showVisualization = true
        await this.$nextTick()
        this.visualize(dataObject)
      }
      catch (error) {
        this.showVisualization = false
        this.foamTreeError = String(error)
      }
    },
    visualize(dataObject: RootFoamGroup) {
      this.foamTree = new FoamTree({
        id: 'visualization',
        // descriptionGroup: 'always',
        layout: 'squarified',
        // stacking: 'flattened',
        dataObject,
      })
    },
  },
}
</script>

<template>
  <div @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <div v-if="isDraggingOver" class="drop-overlay">
      Drop <code>.sublime_session</code> file
    </div>
    <div v-if="!showVisualization" class="full-size input-ui">
      <div class="input-ui-content">
        <h2>Drop <code>Session.sublime_session</code> file onto the page or paste its contents into the box below.</h2>
        <textarea v-model="inputString" class="flex-grow input-field" />
        <button :enabled="inputString" @click="initFoamTree">
          <h4>Visualize</h4>
        </button>
        <p>Source code at <a href="https://github.com/rchl/json-visualizer" target="_blank">github.com/rchl/json-visualizer</a></p>
        <div v-if="foamTreeError" class="error-text">
          {{ foamTreeError }}
        </div>
      </div>
    </div>
    <div v-else id="visualization" class="full-size" />
  </div>
</template>

<style>
body {
  font-family: sans-serif;
  margin: 0;
}
</style>

<style scoped>
.full-size {
  height: 100vh;
  width: 100vw;
}

.input-ui {
  display: flex;
  align-items: center;
}

.input-ui-content {
  display: flex;
  flex-direction: column;
  height: 500px;
  margin: 0 auto;
  max-height: 500px;
  max-width: 500px;
  width: 500px;
}

.input-field {
  white-space: pre;
}

.error-text {
  color: red;
  margin-top: 1rem;
}

.flex-grow {
  flex: 1;
}

.drop-overlay {
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
  bottom: 0;
  color: white;
  display: flex;
  font-size: 2rem;
  justify-content: center;
  left: 0;
  pointer-events: none;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 10;
}
</style>
