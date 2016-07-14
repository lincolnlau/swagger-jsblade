import Vue from 'vue';
import Router from 'vue-router';
import App from './components/App.vue';
import Hello from './components/Hello.vue';

// install router
Vue.use(Router)

// routing
var router = new Router()
router.map({
  '/index': {
    component: Hello
  }
})


router.beforeEach(function () {
  window.scrollTo(0, 0)
})

router.redirect({
  '*': '/index'
})

router.start(App, '#app')
