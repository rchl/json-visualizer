<script lang="ts">
import type { PreviewEntry, RootFoamGroup } from '~/parser'
// @ts-expect-error no types
import { FoamTree } from '@carrotsearch/foamtree'
import jsonToAst from 'json-to-ast'
import { parseRootNode } from '~/parser'

/** Keep the preview fully inside the viewport. Must match the sizes in `.hover-preview`. */
const PREVIEW_WIDTH = 360
const PREVIEW_MAX_HEIGHT = 340
const PREVIEW_CURSOR_OFFSET = 16

export default {
  data() {
    return {
      foamTree: null as any,
      foamTreeError: '',
      inputString: '',
      showVisualization: false,
      isDraggingOver: false,
      previewTitle: '',
      previewEntries: null as PreviewEntry[] | null,
      previewX: 0,
      previewY: 0,
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
    onMouseMove(event: MouseEvent) {
      this.previewX = Math.max(0, Math.min(event.clientX + PREVIEW_CURSOR_OFFSET, window.innerWidth - PREVIEW_WIDTH - PREVIEW_CURSOR_OFFSET))
      this.previewY = Math.max(0, Math.min(event.clientY + PREVIEW_CURSOR_OFFSET, window.innerHeight - PREVIEW_MAX_HEIGHT - PREVIEW_CURSOR_OFFSET))
    },
    onGroupHover(event: { group?: { label?: string, preview?: PreviewEntry[] } | null }) {
      const preview = event.group?.preview
      if (!preview) {
        this.previewEntries = null
        return
      }
      this.previewTitle = (event.group?.label ?? '').split('\n')[0]
      this.previewEntries = preview
    },
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
        onGroupHover: this.onGroupHover,
      })
    },
  },
}
</script>

<template>
  <div @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @mousemove="onMouseMove">
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
    <div
      v-if="previewEntries"
      class="hover-preview"
      :style="{ left: `${previewX}px`, top: `${previewY}px` }"
    >
      <div class="hover-preview-title">
        {{ previewTitle }}
      </div>
      <dl class="hover-preview-entries">
        <template v-for="(entry, index) in previewEntries" :key="index">
          <dt>{{ entry.key }}</dt>
          <dd>{{ entry.value }}</dd>
        </template>
      </dl>
    </div>
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

.hover-preview {
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
  font-size: 12px;
  max-height: 340px;
  overflow: hidden;
  padding: 8px 10px;
  pointer-events: none;
  position: fixed;
  width: 360px;
  z-index: 20;
}

.hover-preview-title {
  border-bottom: 1px solid #eee;
  font-weight: bold;
  margin-bottom: 6px;
  overflow: hidden;
  padding-bottom: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-preview-entries {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  column-gap: 8px;
  margin: 0;
  row-gap: 2px;
}

.hover-preview-entries dt {
  color: #0b6ea8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-preview-entries dd {
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
