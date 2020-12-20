## 从MVVM开始  
<br>

> 首先是数据代理,这一步可以直接通过vm实例调用data中的数据<br><br>
 然后是对data中的数据进行数据劫持,即为观察者,对data中的数据重新进行定义,添加get()和set(),这一步做准备,时还未进行模板编译
  之后是进行模板解析(compile),对数据进行监视,并对data中的数据进行订阅<br><br>
  在初次编译时,并不会产生订阅,因为此时还并没有new watcher(),dep.target为null,不会去调用dep.depend()
  完成初次编译后,进行new watcher,此时才开始进行订阅,
  订阅的关键一点其实是Watcher对象中的get(),get()的作用是获取data中当前的值保存到value中,get()是依赖于getter()方法获取当前的值
  getter()是parseGetter的返回值,是一个函数,通过call()将this指向为vm实例.<br>
  而这一步就是最关键处,getter()想要获取到值,就必然会触发data中的属性的get(),那么就会调用dep.depend(),
  注意Dep.target在watcher的get()中指向了watcher的当前实例
  dep.depend()调用Dep.target.addDep(this),而dep.target即为当前的watcher的实例
  watcher中的addDep又是一个关键点,是在这一步真正完成了数据的订阅,将模板添加到了dep中去
  而addDep接受的是Dep的当前实例,接受到Dep的当前实例后,之后就很好理解了,dep本身对应的是data中的数据,一个数据属性对应一个dep
  在adddDep()中,dep.addSub(this)即是每一个data属性添加页面中所依赖于这个data属性的模板字符串,而这个模板字符串也会添加依赖的data属性,目的是防止重复添加<br>
  说到这里其实就已经完成了mvmm的部署,
  接下来就是数据的变化,触发data中的set()调用notify(),notify()遍历dep中的所有的依赖于这个data属性的模板,依次去调用watcher的update()
  update()调用run(),run()里面调用最开始传入watcher的回调函数,注意这里又用到了闭包,这个回调去触发compile中的updaterFn()至此完成了数据的更新.
