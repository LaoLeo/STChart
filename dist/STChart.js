(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('echarts/src/echarts'), require('echarts/src/chart/graph'), require('echarts/src/component/tooltip')) :
    typeof define === 'function' && define.amd ? define(['echarts/src/echarts', 'echarts/src/chart/graph', 'echarts/src/component/tooltip'], factory) :
    (global = global || self, global.STChart = factory(global.echarts));
}(this, (function (echarts) { 'use strict';

    const NODE_TYPE_TEXT = {
        1: '开始',
        2: '剧情',
        3: '结局'
    };

    /*
            id: dialog.dialogId,
            description: dialog.description,
            name: dialog.name,
            chapter: dialog.chapter,
            index: treeNode ? treeNode.index : dialog.dialogId,
            deepLevel: treeNode ? treeNode.deepLevel : 0, // 在composeProcessDialogs中会用到
            position: posMap[dialog.dialogId],
            isChapFirstNode,
            nodeType: NODE_TYPE_TEXT[dialog.type],
            type: dialog.type,
            children: []
    */

    function filterDialogsByChapter(chapter, processDialogs) {
        let dialogs, dialogsInNextChap;
        if (chapter) {
            dialogs = processDialogs.filter(d => d.chapter === chapter);
            // 衔接点
            dialogsInNextChap = getDialogsOfNextChapter(dialogs, processDialogs);
        } else {
            dialogs = processDialogs;
            dialogsInNextChap = [];
        }

        let f_data = formatData(chapter, [...dialogs, ...dialogsInNextChap], processDialogs);

        return {
            datas: f_data.dioDatas.nodes,
            links: f_data.dioDatas.links
        };
    }

    function formatData(chapter, dioDatas, processDialogs) {
        // 格式化 后台传入的数据

        let links = [];
        let nodes = [];

        // 如果没有内容，初始化数据
        if (dioDatas.length === 0) {
            dioDatas = _genDefaultData(chapter);
            // processDialogs为空时，会影响positionMap的生成
            if (processDialogs.length === 0) processDialogs = dioDatas;
        }

        let posMap = genDialogPosition(chapter, dioDatas, processDialogs);

        let dialogTreeDatas = genDialogTree(processDialogs);

        dioDatas.forEach(value => {
            // 格式化树
            if (value.children) {
                let temp = _genLinks(value, dioDatas);
                links = [...links, ...temp];
            }

            let node = _genNodes(value, posMap, dialogTreeDatas);
            nodes.push(node);
        });

        return {
            'dioDatas': {
                'nodes': nodes,
                'links': links
            }
        };
    }

    function _genLinks(value, dioDatas) {
        let links = [];

        value.children.forEach(nextDialogId => {
            // 检验完整
            let index = -1;
            index = dioDatas.findIndex(function (item) {
                return item.dialogId == nextDialogId;
            });

            if (index >= 0) {
                // 选项->下一节点
                links.push({
                    id: value.dialogId + '-' + nextDialogId,
                    name: `${value.name} -> ${dioDatas[index].name}`,
                    source: value.dialogId,
                    target: nextDialogId
                });
            }
        });

        return links;
    }

    function _genNodes(dialog, posMap, dialogTreeDatas) {

        let treeNode = dialogTreeDatas.find(n => n.id === dialog.dialogId);
        let isChapFirstNode = false;
        if (treeNode) {
            // 挂上深度deepLevel，在moveDialogs中会作为判断条件
            dialog.deepLevel = treeNode.deepLevel;
            isChapFirstNode = treeNode.parents.some(d => d.chapter !== dialog.chapter);
        }

        let node = {
            id: dialog.dialogId,
            description: dialog.description,
            name: dialog.name,
            chapter: dialog.chapter,
            index: treeNode ? treeNode.index : dialog.dialogId,
            deepLevel: treeNode ? treeNode.deepLevel : 0, // 在composeProcessDialogs中会用到
            position: posMap[dialog.dialogId],
            isChapFirstNode,
            nodeType: NODE_TYPE_TEXT[dialog.type],
            type: dialog.type,
            children: dialog.children
        };

        return node;
    }

    function _genDefaultData(chapter) {
        let dioDatas = [];

        if (chapter === 1) {
            let startId = genRandomId();
            let nextId = genRandomId();

            dioDatas = [{
                dialogId: `d_${startId}`,
                description: '这是一个故事的开头，播完会进入第一个剧情',
                name: '开头',
                type: 1,
                nodeType: NODE_TYPE_TEXT[1],
                chapter: 1,
                deepLevel: 0,
                children: [`d_${nextId}`]
            }, {
                dialogId: `d_${nextId}`,
                description: '这是故事的第一个剧情，完成后用户可以开始进行选择。这也是一个存档点，用户再次进入游戏时会跳过开头从这里开始',
                name: '1-1:剧情',
                type: 2,
                nodeType: NODE_TYPE_TEXT[2],
                chapter: 1,
                deepLevel: 1
            }];
        }

        return dioDatas;
    }

    function genDialogPosition(currChapNo, dialogs, processDialogs) {
        let roots = findRoots(currChapNo, processDialogs);
        let posMap = {};
        roots.forEach(root => {
            let position = 0;
            _genPos(root, position, dialogs);
        });

        function _genPos(node, position, dialogs) {
            posMap[node.dialogId] = position;

            let nextIds = getNextDialogIds(node);
            nextIds.forEach(id => {
                let child = dialogs.find(d => d.dialogId === id);
                if (child) {
                    if (posMap[child.dialogId] === undefined) {
                        _genPos(child, position + 1, dialogs);
                    }
                }
            });
        }

        return posMap;
    }

    // 找出不作为子节点的节点作为首节点
    // 问题: 章节第一个节点成环会出问题，找不出第一个节点
    function _findRoots$1(dioDatas) {
        let nextIds = [];
        dioDatas.filter(d => !!d.children).forEach(d => {
            nextIds = [...nextIds, ...d.children];
        });

        return dioDatas.filter(d => !nextIds.includes(d.dialogId));
    }

    // 父节点位于其他章节的节点作为首节点
    function _findRoots$2(currChapNo, processDialogs) {
        let roots = [];
        processDialogs.forEach(d => {
            if (d.chapter === currChapNo) return;

            let nextIds = getNextDialogIds(d);
            let nextDialog = nextIds.map(id => processDialogs.find(d => d.dialogId === id));
            nextDialog.forEach(d => {
                if (d.chapter === currChapNo) roots.push(d);
            });
        });

        return roots;
    }

    // 选出章节或剧情的根节点，可能有多个
    function findRoots(currChapNo, processDialogs) {
        if (typeof processDialogs === 'undefined') {
            processDialogs = currChapNo;
            return _findRoots$1(processDialogs);
        }

        // 章节内不是子节点的节点为首节点
        let currChapDialog;
        if (currChapNo) {
            currChapDialog = processDialogs.filter(d => d.chapter === currChapNo);
        } else {
            currChapDialog = processDialogs;
        }
        let roots$1 = _findRoots$1(currChapDialog);

        // 跳章节点为首节点
        let roots$2 = _findRoots$2(currChapNo, processDialogs);

        let roots = [...new Set(roots$1.concat(roots$2))];

        if (roots.length === 0 && currChapDialog.length !== 0) {
            // 章内节点与首节点成环，且首节点不被其他章节链接
            // 这种情况非常特殊，选取该章节节点数组第一个作为首节点
            roots.push(currChapDialog[0]);
        }

        return roots;
    }

    // 生成剧情衔接点
    function getDialogsOfNextChapter(dialogs, processDialogs) {
        const idInCurrChap = dialogs.map(d => d.dialogId);
        let result = [];

        dialogs.forEach(d => {
            let nextIds = getNextDialogIds(d);
            let ids = nextIds.filter(id => !idInCurrChap.includes(id));
            let dialogs = ids.map(id => processDialogs.find(d => d.dialogId === id));
            result = [...result, ...dialogs];
        });

        return [...new Set(result)].filter(d => !!d);
    }

    // 生成剧情节点树节点数组
    function genDialogTree(processDialogs) {
        let roots = findRoots(processDialogs);
        // let root = processDialogs.find(d => d.type === 1)
        let nodes = [];

        roots.forEach(root => {
            root && _gen(root, null, null, 0, processDialogs, nodes);
        });

        function _gen(dialog, parent, preNode, deepLevel, processDialogs, nodes) {
            let handledNode = nodes.find(n => n.id === dialog.dialogId);

            if (!handledNode) {
                let node = {
                    id: dialog.dialogId,
                    children: [],
                    parents: parent ? [parent] : [],
                    deepLevel,
                    index: preNode ? `${preNode.index}->${dialog.dialogId}` : dialog.dialogId
                };
                nodes.push(node);

                let nextIds = getNextDialogIds(dialog);
                deepLevel++;
                nextIds.forEach(id => {
                    let child = processDialogs.find(d => d.dialogId === id);
                    if (child) {
                        // 避免子节点不在剧情树中的情况，一般这种情况是同步数据有误
                        node.children.push(child);

                        _gen(child, dialog, node, deepLevel, processDialogs, nodes);
                    }
                });
                // nodes.push(node)

            } else {
                let isExist = parent && handledNode.parents.find(p => p.id === parent.dialogId);
                if (!isExist) handledNode.parents.push(parent);
            }
        }

        // 检测有没有处理了所有的剧情点
        // 当全部剧情点中成环的剧情点是没有处理的，因为findRoots函数没办法判断出来
        if (nodes.length !== processDialogs.length) {
            let dialogsOnCricle = processDialogs.filter(d => !nodes.find(n => n.id === d.dialogId));
            dialogsOnCricle.forEach(d => {
                _gen(d, null, null, 0, processDialogs, nodes);
            });
        }

        return nodes;
    }

    function genRandomId() {
        let randomStr = Math.random().toString(36);
        let offset = Math.floor(Math.random() * (randomStr.length - 3));
        let id = randomStr.slice(offset, offset + 3);

        return id;
    }

    // 获取剧情点的下一级子节点的id
    function getNextDialogIds(dialog) {
        return (dialog.children || []).filter(id => id !== '' && id !== '-1');
    }

    /**
    * @desc 函数防抖---“立即执行版本” 和 “非立即执行版本” 的组合版本
    * @param func 需要执行的函数
    * @param wait 延迟执行时间（毫秒）
    * @param immediate---true 表立即执行，false 表非立即执行
    **/
    function debounce(func, wait, immediate) {
        let timer;

        return function () {
            let context = this;
            let args = arguments;

            if (timer) clearTimeout(timer);
            if (immediate) {
                var callNow = !timer;
                timer = setTimeout(() => {
                    timer = null;
                }, wait);
                if (callNow) func.apply(context, args);
            } else {
                timer = setTimeout(function () {
                    func.apply(context, args);
                }, wait);
            }
        };
    }

    /**
     * 剧情分支树图表
     */

    class STChart {
        constructor(el) {
            this.el = el;
            this.chart = null;
            this.currChapter = 0;
            this.processDialogs = null;
            this.clickHandler = null;
            this.mouseoutHandler = null;
            this.mouseoverHandler = null;
            this._defaultOpt = {
                // title: {
                //     text: '',
                //     subtext: '',
                //     top: 'bottom',
                //     left: 'right'
                // },
                xAxis: {
                    type: 'value',
                    show: false,
                    min: 0,
                    max: 'dataMax',
                    splitLine: {
                        show: true
                    },
                    value: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
                    // position: "bottom"
                },
                yAxis: {
                    type: 'value',
                    show: false,
                    min: 0,
                    max: 'dataMax',
                    splitLine: {
                        show: true
                    },
                    position: "left",
                    value: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40]
                },
                backgroundColor: 'rgba(210, 236, 252, 0.2)',
                tooltip: {
                    // 鼠标悬浮展示内容
                    // confine: false,
                    // position: [10, 10],
                    position: function (pos, params, el, elRect, size) {
                        var obj = { top: 10 };
                        obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
                        return obj;
                    },
                    formatter: function (data) {
                        if (data.dataType == "node") {
                            let sourceData = data.data.dataSet;
                            let str = '';
                            str = str + '【名称】' + sourceData.name + '<br />';
                            str = str + `【章节】第${sourceData.chapter}章<br />`;
                            str += `【剧情】 ${sourceData.description}`;
                            // if (sourceData.selectors.length > 1) {
                            //     str = str + '【选项】' + '<br />';
                            //     sourceData.selectors.forEach((item, index) => {
                            //         str =
                            //             str +
                            //             '<span style="margin-left:1rem;color:#eaeaea" >第' +
                            //             (index + 1) +
                            //             '项:' +
                            //             item.keywordsArr.join(',') +
                            //             '</p><br />';
                            //     });
                            // }
                            return str;
                        } else if (data.dataType == "edge") {
                            return data.data.name;
                        }
                    }
                },
                series: [{
                    type: 'graph',
                    layout: 'none',
                    // coordinateSystem: 'cartesian2d', //采用直角坐标系
                    symbolSize: [40, 15],
                    symbolOffset: [5, 0],
                    roam: 'scale',
                    label: {
                        normal: {
                            color: 'rgba(0, 0, 0, 0.6)',
                            fontStyle: 'normal',
                            show: true
                        }
                    },
                    symbol: 'circle',
                    edgeSymbol: ['circle', 'arrow'],
                    edgeSymbolSize: [4, 10],
                    // edgeLabel: {
                    //     fontSize: 20
                    // },
                    data: [], // 挂载自定数据
                    links: [], // 挂载箭头连线数据
                    lineStyle: {
                        normal: {
                            opacity: 0.9,
                            width: 2,
                            curveness: 0
                        }
                    }
                }]
            };
            this.treeConfig = {
                xStartPosition: 10,
                yPositionSize: 3,
                xPositionSize: 5,
                edge: {
                    style: ['none', 'arrow'],
                    size: [0, 2]
                },
                line: {
                    type: "solid",
                    opacity: 0.9,
                    width: 2
                },
                lineDashed: {
                    type: "dashed",
                    opacity: 0.2,
                    width: 2
                },
                guts: {
                    begin: {
                        symbol: 'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                        symbolSize: [50, 24],
                        bgColor: 'rgba(243,46,0,0.5)',
                        borderColor: 'rgba(243,46,0,1)',
                        borderSize: '8px'
                    },
                    guts: {
                        needSave: {
                            symbol: 'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                            symbolSize: [50, 24],
                            bgColor: 'rgba(17,135,255,0.5)',
                            borderColor: 'rgba(17,135,255,1)',
                            borderSize: '8px'
                        },
                        nonSave: {
                            symbol: 'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                            symbolSize: [50, 24],
                            bgColor: 'rgba(17,135,255,0.5)',
                            borderSize: 0
                        }
                    },
                    ending: {
                        symbol: 'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                        symbolSize: [50, 24],
                        bgColor: 'rgba(250,173,20,0.5)',
                        borderColor: 'rgba(250,173,20,0.1)',
                        borderSize: '8px'
                    },
                    next: {
                        symbol: 'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                        symbolSize: [50, 24],
                        bgColor: 'rgba(0,0,0,0.1)',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderSize: '8px'
                    }
                },
                dataZoom: [{
                    type: 'slider',
                    show: false,
                    xAxisIndex: [0],
                    startValue: 0,
                    endValue: 50,
                    minValueSpan: 40,
                    maxValueSpan: 200,
                    showDetail: false,

                    filterMode: 'weakFilter',
                    height: 20,

                    handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                    handleSize: '80%'
                }, {
                    type: 'inside',
                    show: false,

                    zoomOnMouseWheel: 'shift',
                    zoomLock: true,
                    xAxisIndex: [0]
                }]
            };
        }

        static init(el) {
            let instance = new STChart(el);
            instance.setOption();
            return instance;
        }

        setOption(opt = {}) {
            this._extend(this._defaultOpt, opt);
            this.chart = echarts.init(this.el);
            // if (this.processDialogs) this.renderStory()
            // return this
        }

        setData(dialogs) {
            if (this._typeof(dialogs) == "Array") {
                this.processDialogs = dialogs;
                // this.setOption()
                return this;
            } else {
                throw new Error("dialos " + dialogs + " is not array!");
            }
        }

        prevChap() {
            if (this.currChapter <= 1) return;
            this.renderStory(--this.currChapter);
        }

        nextChap() {
            this.renderStory(++this.currChapter);
        }

        registerListener(event, handler, self) {
            if (this._typeof(handler) != "Function") {
                throw new Error(`${handler} is required function`);
            }
            let args = Array.prototype.slice.call(arguments, 3);

            switch (event) {
                case "click":
                    this.clickHandler = handler.bind(self, ...args);
                    break;
                case "mouseout":
                    this.mouseoutHandler = handler.bind(self, ...args);
                    break;
                case "mouseover":
                    this.mouseoverHandler = handler.bind(self, ...args);
                    break;
            }
        }

        /**
         * 按章节显示剧情
         * @param {Number} chapter 
         */
        renderStory(chapter) {
            this.currChapter = chapter || 0;
            let graphSeries = this._defaultOpt.series[0];

            let chartData = filterDialogsByChapter(this.currChapter, this.processDialogs);
            graphSeries.data = [];
            graphSeries.links = [];
            chartData.datas.forEach(data => {
                let nodeData = {
                    id: data.id,
                    name: data.name,
                    itemStyle: {
                        normal: {
                            color: ''
                        }
                    },
                    chapterNo: data.chapter ? data.chapter : '1',
                    isOfNextChap: this.currChapter !== 0 && this.currChapter !== data.chapter,
                    symbol: '',
                    symbolSize: [0, 0],
                    x: 0,
                    y: 0,
                    dataSet: data,
                    attributes: {
                        modularity_class: ''
                    }
                };
                graphSeries.data.push(nodeData);
            });
            chartData.links.forEach(link => {
                let targetNode = graphSeries.data.find(d => d.id === link.target);
                let linkType = targetNode.isOfNextChap ? 'lineDashed' : 'line';

                let linkData = {
                    id: link.id,
                    name: link.name,
                    source: link.source,
                    target: link.target,
                    lineStyle: this.treeConfig[linkType]
                };
                graphSeries.links.push(linkData);
            });

            console.warn(graphSeries);

            this.chart.showLoading();
            this._resizeGutNode();
        }

        _resizeGutNode() {
            // 按照position排序
            let graphSeries = this._defaultOpt.series[0];
            graphSeries.data.sort(function (a, b) {
                return a.dataSet.position - b.dataSet.position;
            });
            this.maxPosition = graphSeries.data[graphSeries.data.length - 1].dataSet.position;

            this._repositionNodes();

            this._showTree('rezoom');
        }

        _repositionNodes() {
            let positonCount = new Map();
            // 顺序调整结束

            let maxCount = 0;

            // 遍历每个列，计算每个position数目
            this._defaultOpt.series[0].data.forEach(node => {
                // 剧情点
                if (positonCount.get(node.dataSet.position) > 0) {
                    positonCount.set(node.dataSet.position, positonCount.get(node.dataSet.position) + 1);
                } else {
                    positonCount.set(node.dataSet.position, 1);
                }

                if (positonCount.get(node.dataSet.position) > maxCount) {
                    maxCount = positonCount.get(node.dataSet.position);
                }
            });
            // 计算每个position数目结束

            // 开始重新计算Y值

            let positonCount_Used = new Map();

            this._defaultOpt.series[0].data.forEach(node => {
                // 剧情点
                if (positonCount_Used.get(node.dataSet.position) > 0) {
                    positonCount_Used.set(node.dataSet.position, positonCount_Used.get(node.dataSet.position) + 1);
                } else {
                    positonCount_Used.set(node.dataSet.position, 1);
                }

                // var dz = parseInt(maxCount * 10 / (positonCount.get(node.dataSet.position)))
                var dz = this.treeConfig.xPositionSize;

                node.y = (positonCount.get(node.dataSet.position) + 1) * dz / 2 - dz * positonCount_Used.get(node.dataSet.position);

                node.x = node.dataSet.position * this.treeConfig.xPositionSize + this.treeConfig.xStartPosition;
                node.y = parseInt(node.y);
                node.x = parseInt(node.x);
            });
        }

        _showTree(rezoom) {
            this.chart.showLoading();

            this._defaultOpt.series[0].data.forEach(data => {
                data.value = [data.x, data.y];

                // 设置节点样式
                this._setGutsStyle(data);

                // this.nodeMap.set(data.dataSet.id, data.dataSet);
            });

            // 调整dataZoom位置
            if (!this._defaultOpt.dataZoom) this._defaultOpt.dataZoom = this.treeConfig.dataZoom;
            // 如果节点少，那么隐藏底部滚动条
            if (this.maxPosition * this.treeConfig.xPositionSize <= 50) {
                this._defaultOpt.dataZoom[0].show = false;
            } else {
                this._defaultOpt.dataZoom[0].show = true;
                let _defaultOpt = this.chart.getOption();
                if (_defaultOpt) {
                    this._defaultOpt.dataZoom[0].startValue = _defaultOpt.dataZoom[0].startValue;
                    let endValue = this._defaultOpt.dataZoom[0].endValue = _defaultOpt.dataZoom[0].endValue;
                    if (endValue > 99) this._defaultOpt.dataZoom[0].endValue = this.maxPosition * this.treeConfig.xPositionSize + 10;
                }
            }

            // 重置进度条
            if (rezoom) {
                this._defaultOpt.dataZoom[0].startValue = 0;
                this._defaultOpt.dataZoom[0].endValue = 50;
            }

            // 调整X轴
            // console.log(this.maxPosition);
            this._defaultOpt.xAxis.max = this.maxPosition * this.treeConfig.xPositionSize + 10;

            this.chart.on('click', debounce(params => {
                this.clickHandler && this.clickHandler(params);
            }, 200, true));

            this.chart.on('mouseout', debounce(params => {
                this.mouseoutHandler && this.mouseoutHandler(params);
            }, 200, true));

            this.chart.on('mouseover', debounce(params => {
                this.mouseoverHandler && this.mouseoverHandler(params);
            }, 200, true));

            this.chart.hideLoading();
            this.chart.setOption(this._defaultOpt);
        }

        // 设置节点样式
        _setGutsStyle(nodeData) {
            if (nodeData.isOfNextChap) {
                nodeData.symbol = this.treeConfig.guts['next'].symbol;
                nodeData.symbolSize = this.treeConfig.guts['next'].symbolSize;
                nodeData.itemStyle.normal.color = this.treeConfig.guts['next'].bgColor;
                nodeData.itemStyle.normal.cursor = 'not-allowed';
                nodeData.itemStyle.normal.borderColor = this.treeConfig.guts['next'].borderColor;
                nodeData.itemStyle.normal.borderSize = this.treeConfig.guts['next'].borderSize;
                nodeData.itemStyle.normal.opacity = 0.4;
                // nodeData.attributes.modularity_class = '衔接点';

                return;
            }

            let data = nodeData.dataSet;

            // ['开始', '剧情', '结局'],
            if (data.nodeType == '开始') {
                nodeData.symbol = this.treeConfig.guts['begin'].symbol;
                nodeData.symbolSize = this.treeConfig.guts['begin'].symbolSize;
                nodeData.itemStyle.normal.color = this.treeConfig.guts['begin'].bgColor;
                nodeData.itemStyle.normal.borderColor = this.treeConfig.guts['begin'].borderColor;
                nodeData.itemStyle.normal.borderSize = this.treeConfig.guts['begin'].borderSize;
            } else if (data.nodeType == '剧情') {
                nodeData.symbol = this.treeConfig.guts['guts'].nonSave.symbol;
                nodeData.symbolSize = this.treeConfig.guts['guts'].nonSave.symbolSize;
                nodeData.itemStyle.normal.color = this.treeConfig.guts['guts'].nonSave.bgColor;
                nodeData.itemStyle.normal.borderSize = this.treeConfig.guts['guts'].nonSave.borderSize;
                // nodeData.attributes.modularity_class = '剧情';
            } else if (data.nodeType == '结局') {
                nodeData.symbol = this.treeConfig.guts['ending'].symbol;
                nodeData.symbolSize = this.treeConfig.guts['ending'].symbolSize;
                nodeData.itemStyle.normal.color = this.treeConfig.guts['ending'].bgColor;
                nodeData.itemStyle.normal.borderColor = this.treeConfig.guts['ending'].borderColor;
                nodeData.itemStyle.normal.borderSize = this.treeConfig.guts['ending'].borderSize;
            }

            return nodeData;
        }

        _extend(target, obj) {
            Object.keys(obj).forEach(key => {
                if (_typeof(obj[key]) == "object") {
                    if (target[key]) this._extend(target[key], obj[key]);
                } else {
                    target[key] = obj[key];
                }
            });
            return target;
        }

        _typeof(o) {
            return Object.prototype.toString.call(o).slice(8, -1);
        }
    }

    return STChart;

})));
//# sourceMappingURL=STChart.js.map
