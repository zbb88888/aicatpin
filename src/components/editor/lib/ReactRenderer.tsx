import React from 'react'
import { createRoot, Root } from 'react-dom/client'

export interface ReactRendererOptions {
  props: Record<string, any>
  editor: any
}

export class ReactRenderer {
  element: HTMLElement
  component: React.ComponentType<any>
  props: Record<string, any>
  editor: any
  root: Root | null = null

  constructor(
    component: React.ComponentType<any>,
    options: ReactRendererOptions
  ) {
    this.component = component
    this.props = options.props
    this.editor = options.editor
    this.element = document.createElement('div')
    this.element.className = 'react-renderer'
    this.render()
  }

  render() {
    const Component = this.component
    this.root = createRoot(this.element)
    this.root.render(
      <Component
        {...this.props}
        editor={this.editor}
        ref={(ref: any) => {
          this.ref = ref
        }}
      />
    )
  }

  updateProps(props: Record<string, any>) {
    this.props = { ...this.props, ...props }
    this.render()
  }

  destroy() {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
  }

  ref: any = null
}