/*
 * @Descripttion: 
 * @version: 
 * @Author: windowdotonload
 */
/*
 * @Descripttion: 
 * @version: 
 * @Author: windowdotonload
 */
/*
 * @Descripttion: 
 * @version: 
 * @Author: windowdotonload
 */

//  mvvm整体实现思路:
/**
 * 从mvvm开始:
 * 
 * 首先是数据代理,这一步可以直接通过vm实例调用data中的数据
 * 然后是对data中的数据进行数据劫持,即为观察者,对data中的数据重新进行定义,添加get()和set(),这一步做准备,此时还未进行模板编译
 * 
 * 之后是进行模板解析(compile),对数据进行监视,并对data中的数据进行订阅
 * 在初次编译时,并不会产生订阅,因为此时还并没有new watcher(),dep.target为null,不会去调用dep.depend()
 * 
 * 完成初次编译后,进行new watcher,此时才开始进行订阅,
 * 订阅的关键一点其实是Watcher对象中的get(),get()的作用是获取data中当前的值保存到value中,get()是依赖于getter()方法来获取当前的值
 * getter()是parseGetter的返回值,是一个函数,通过call()将this指向为vm实例,
 * 而这一步就是最关键处,getter()想要获取到值,就必然会触发data中的属性的get(),那么就会调用dep.depend(),
 * 注意Dep.target在watcher的get()中指向了watcher的当前实例
 * dep.depend()调用Dep.target.addDep(this),而dep.target即为当前的watcher的实例
 * watcher中的addDep又是一个关键点,是在这一步真正完成了数据的订阅,将模板添加到了dep中去
 * 而addDep接受的是Dep的当前实例,
 * 这里需要额外注意一下,是对data中的每一个属性都进行Object.defineProperty,这是通过在walk()中遍历object.keys()获取到的所有属性,然后通过convert()调用defineReactive()
 * mvvm中多处用到了闭包,同样的这里也是,在defineReactive中都会创建一个dep实例,,在每次对data中的一个属性进行定义时,都会定义到这个dep实力,所以其实是存在很多个dep实例
 * 这里就顺便说一下Dep.target,Dep是一个对象,也即是构造函数,这是唯一的,每次在watcher中将Dep.target指向当前watcher的实例,在操作完成后需要置为空
 * 说回addDep(),接受到Dep的当前实例后,之后就很好理解了,dep本身对应的是data中的数据,一个数据属性对应一个dep
 * 在adddDep()中,dep.addSub(this)即是每一个data属性添加页面中所依赖于这个data属性的模板字符串,而这个模板字符串也会添加依赖的data属性,目的是防止重复添加
 * 说到这里其实就已经完成了mvmm的部署,
 * 接下来就是数据的变化,触发data中的set()调用notify(),notify()遍历dep中的所有的依赖于这个data属性的模板,依次去调用watcher的update()
 * update()调用run(),run()里面调用最开始传入watcher的回调函数,注意这里又用到了闭包,其实本质上就是依靠闭包,一直保存着这个node节点才能完成后期的更新,后期的更新其实也是就是操作这个node节点
 * 这个回调去触发compile中的updaterFn()至此完成了数据的更新
 * 
 */
function MVVM(options) {
    this.$options = options || {};
    var data = this._data = this.$options.data;
    var me = this;
    console.log('---------')
    console.log('mvvm this ', this)
    console.log('---------')

    // 数据代理
    // 实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function (key) {
        me._proxyData(key);
    });

    this._initComputed();

    observe(data, this);

    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    constructor: MVVM,
    $watch: function (key, cb, options) {
        new Watcher(this, key, cb);
    },

    _proxyData: function (key, setter, getter) {
        var me = this;
        setter = setter ||
            Object.defineProperty(me, key, {
                configurable: false,
                enumerable: true,
                get: function proxyGetter() {
                    return me._data[key];
                },
                set: function proxySetter(newVal) {
                    //这里改变了_data，data也会改变，因为data是一个对象，_data = data,操作的是同一段地址
                    me._data[key] = newVal;
                }
            });
    },

    _initComputed: function () {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get,
                    set: function () { }
                });
            });
        }
    }
};