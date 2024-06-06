import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Laniakea',
  description: 'Laniakea Documentation',
  srcDir: './docs',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Intro',
        items: [
          { text: 'What is Laniakea?', link: '/intro' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Exceptions', link: '/exceptions' },
        ],
      },
      {
        text: 'Repositories',
        items: [
          { text: 'Repositories', link: '/repositories' },
          { text: 'Criteria', link: '/repositories/criteria' },
        ],
      },
      {
        text: 'Resources',
        items: [
          { text: 'Resources', link: '/resources' },
          { text: 'Filters', link: '/resources/filters' },
          { text: 'Inclusions', link: '/resources/inclusions' },
          { text: 'Sorters', link: '/resources/sorters' },
          { text: 'Requests', link: '/resources/requests' },
          { text: 'Manager', link: '/resources/manager' },
          { text: 'Registrars', link: '/resources/registrars' },
          { text: 'Versions', link: '/resources/versions' },
        ],
      },
      {
        text: 'Model Settings',
        items: [
          { text: 'Settings', link: '/settings' },
          { text: 'Types', link: '/settings/types' },
        ],
      },
      {
        text: 'Forms',
        items: [
          { text: 'Forms', link: '/forms' },
          { text: 'Fields', link: '/forms/fields' },
          { text: 'Custom Fields', link: '/forms/fields/custom' },
          { text: 'Forms Manager', link: '/forms/manager' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tzurbaev/laniakea' }
    ]
  }
})
