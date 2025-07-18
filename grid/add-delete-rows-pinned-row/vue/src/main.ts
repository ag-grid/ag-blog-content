import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faPersonSwimming, faPersonRunning, faPersonBiking, faPersonSkiing } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faPersonSwimming, faPersonRunning, faPersonBiking, faPersonSkiing)

const app = createApp(App)

/* add font awesome icon component */
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
