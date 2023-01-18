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
        // layout: 'squarified',
        // stacking: 'flattened',
        dataObject,
      })
    },
  },
}
</script>

<template>
  <div>
    <div v-if="!showVisualization" class="full-size input-ui">
      <div class="input-ui-content">
        <h3>Paste <code>Session.sublime_session</code> contents</h3>
        <textarea v-model="inputString" class="flex-grow input-field" />
        <button :enabled="inputString" @click="initFoamTree">
          <h4>Visualize</h4>
        </button>
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
</style>
