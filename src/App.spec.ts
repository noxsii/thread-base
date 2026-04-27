import { mount } from '@vue/test-utils'
import App from './App.vue'

describe('App', () => {
  it('mounts without throwing', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('thread-base')
  })
})
