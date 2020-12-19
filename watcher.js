/*
 * @Descripttion: 
 * @version: 
 * @Author: windowdotonload
 */
function Watcher(vm, expOrFn, cb) {
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};

    if (typeof expOrFn === 'function') {
        this.getter = expOrFn;
    } else {
        this.getter = this.parseGetter(expOrFn.trim());
    }
    // value是保存是初始值以及上一次的值，在run()中，再次调用get()获取到了新的值
    this.value = this.get();
}

Watcher.prototype = {
    constructor: Watcher,
    update: function () {
        this.run();
    },
    run: function () {
        var value = this.get();
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    },
    addDep: function (dep) {
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
            //为什么要加上this.depids[dep.id] = dep ,其实如果是要去修改页面的模板内容，只要依据dep中的subs即可，
            //这样看来似乎是只要有dep.addSub()就够了，但是如何判断一个dep中是否已经添加了这个模板字符串呢?这就是this.depIds[dep.id] = dep的意义
            //在dep中添加这个模板字符串的时候，这个模板也会记录保存这个dep的id，在下一次addDep()时，如果这个模板字符串已经添加了这个dep(也即是data中的属性)
            //那么就不会执行这两条语句，dep也就不会再重复添加这个模板字符串
        }
    },
    // 主要就是依靠get()建立watcher和dep的关系，将watcher添加到dep的sub数组中
    // get()调用了getter()去获取vm代理的值,因为之前已经通过observer对data的所有数据进行了数据劫持,所以会触发data中的get()
    // 触发了get(),那么就会调用get()中的dep.depend()方法,而Dep.target就是在此处指向了watcher的this
    get: function () {
        Dep.target = this;
        var value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    },

    parseGetter: function (exp) {
        if (/[^\w.$]/.test(exp)) return;

        var exps = exp.split('.');

        return function (obj) {
            for (var i = 0, len = exps.length; i < len; i++) {
                if (!obj) return;
                obj = obj[exps[i]];
            }
            return obj;
        }
    }
};