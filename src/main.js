/**
 * 剧情分支树图表
 */

import * as echarts from "echarts/src/echarts"
import "echarts/src/chart/graph"
// 引入提示框组件、标题组件、工具箱组件。
import 'echarts/src/component/tooltip';
// import 'echarts/src/component/title';
// import 'echarts/src/component/toolbox';
import { filterDialogsByChapter, debounce } from "./util"

export default class STChart {
    constructor(el) {
        this.el = el
        this.chart = null
        this.currChapter = 0
        this.processDialogs = null
        this.clickHandler = null
        this.mouseoutHandler = null
        this.mouseoverHandler = null
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
                        str += `【剧情】 ${sourceData.description}`
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
            series: [
                {
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
                }
            ],
        }
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
                width: 2,
            },
            lineDashed: {
                type: "dashed",
                opacity: 0.2,
                width: 2,
            },
            guts: {
                begin: {
                    symbol:
                        'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                    symbolSize: [50, 24],
                    bgColor: 'rgba(243,46,0,0.5)',
                    borderColor: 'rgba(243,46,0,1)',
                    borderSize: '8px'
                },
                guts: {
                    needSave: {
                        symbol:
                            'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                        symbolSize: [50, 24],
                        bgColor: 'rgba(17,135,255,0.5)',
                        borderColor: 'rgba(17,135,255,1)',
                        borderSize: '8px'
                    },
                    nonSave: {
                        symbol:
                            'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                        symbolSize: [50, 24],
                        bgColor: 'rgba(17,135,255,0.5)',
                        borderSize: 0
                    }
                },
                ending: {
                    symbol:
                        'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                    symbolSize: [50, 24],
                    bgColor: 'rgba(250,173,20,0.5)',
                    borderColor: 'rgba(250,173,20,0.1)',
                    borderSize: '8px'
                },
                next: {
                    symbol:
                        'path://M183.296,126.771c0,2.87-2.327,5.197-5.197,5.197H45.865c-2.87,0-5.197-2.327-5.197-5.197V79.545c0-2.87,2.327-5.197,5.197-5.197H178.1c2.87,0,5.197,2.327,5.197,5.197V126.771z',
                    symbolSize: [50, 24],
                    bgColor: 'rgba(0,0,0,0.1)',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderSize: '8px'
                }
            },
            dataZoom: [
                {
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

                    handleIcon:
                        'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                    handleSize: '80%'
                },
                {
                    type: 'inside',
                    show: false,

                    zoomOnMouseWheel: 'shift',
                    zoomLock: true,
                    xAxisIndex: [0]
                }
            ]
        }
    }

    static init(el) {
        let instance = new STChart(el)
        instance.setOption()
        return instance
    }

    setOption(opt = {}) {
        this._extend(this._defaultOpt, opt)
        this.chart = echarts.init(this.el)
        // if (this.processDialogs) this.renderStory()
        // return this
    }

    setData(dialogs) {
        if (this._typeof(dialogs) == "Array") {
            this.processDialogs = dialogs
            // this.setOption()
            return this
        } else {
            throw new Error("dialos "+dialogs+" is not array!")
        }
    }

    prevChap() {
        if (this.currChapter <= 1)  return
        this.renderStory(--this.currChapter)
    }

    nextChap() {
        this.renderStory(++this.currChapter)
    }

    registerListener(event, handler, self) {
        if (this._typeof(handler) != "Function") {
            throw new Error(`${handler} is required function`)
        }
        let args = Array.prototype.slice.call(arguments, 3)
        
        switch (event) {
            case "click":
                this.clickHandler = handler.bind(self, ...args)
                break
            case "mouseout":
                this.mouseoutHandler = handler.bind(self, ...args)
                break
            case "mouseover":
                this.mouseoverHandler = handler.bind(self, ...args)
                break
        }
    }

    /**
     * 按章节显示剧情
     * @param {Number} chapter 
     */
    renderStory(chapter) {
        this.currChapter = chapter || 0
        let graphSeries = this._defaultOpt.series[0]

        let chartData = filterDialogsByChapter(this.currChapter, this.processDialogs)
        graphSeries.data = []
        graphSeries.links = []
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
            }
            graphSeries.data.push(nodeData)
        })
        chartData.links.forEach(link => {
            let targetNode = graphSeries.data.find(
                d => d.id === link.target
            );
            let linkType = targetNode.isOfNextChap ? 'lineDashed' : 'line';

            let linkData = {
                id: link.id,
                name: link.name,
                source: link.source,
                target: link.target,
                lineStyle: this.treeConfig[linkType]
            };
            graphSeries.links.push(linkData)
        })

        console.warn(graphSeries)

        this.chart.showLoading()
        this._resizeGutNode()
    }

    _resizeGutNode() {
        // 按照position排序
        let graphSeries = this._defaultOpt.series[0]
        graphSeries.data.sort(function (a, b) {
            return a.dataSet.position - b.dataSet.position;
        });
        this.maxPosition =
            graphSeries.data[
                graphSeries.data.length - 1
            ].dataSet.position;

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
                positonCount.set(
                    node.dataSet.position,
                    positonCount.get(node.dataSet.position) + 1
                );
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

        this._defaultOpt.series[0].data.forEach((node) => {
            // 剧情点
            if (positonCount_Used.get(node.dataSet.position) > 0) {
                positonCount_Used.set(
                    node.dataSet.position,
                    positonCount_Used.get(node.dataSet.position) + 1
                );
            } else {
                positonCount_Used.set(node.dataSet.position, 1);
            }

            // var dz = parseInt(maxCount * 10 / (positonCount.get(node.dataSet.position)))
            var dz = this.treeConfig.xPositionSize;

            node.y =
                ((positonCount.get(node.dataSet.position) + 1) * dz) / 2 -
                dz * positonCount_Used.get(node.dataSet.position);

            node.x = node.dataSet.position * this.treeConfig.xPositionSize + this.treeConfig.xStartPosition;
            node.y = parseInt(node.y);
            node.x = parseInt(node.x);
        });
    }

    _showTree(rezoom) {
        this.chart.showLoading();

        this._defaultOpt.series[0].data.forEach((data) => {
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
        this._defaultOpt.xAxis.max =
            this.maxPosition * this.treeConfig.xPositionSize + 10;

        this.chart.on('click', debounce((params) => {
            this.clickHandler && this.clickHandler(params)
        }, 200, true));

        this.chart.on('mouseout', debounce((params) => {
            this.mouseoutHandler && this.mouseoutHandler(params)
        }, 200, true));

        this.chart.on('mouseover', debounce((params) => {
            this.mouseoverHandler && this.mouseoverHandler(params)
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
            nodeData.itemStyle.normal.borderColor = this.treeConfig.guts[
                'next'
            ].borderColor;
            nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
                'next'
            ].borderSize;
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
            nodeData.itemStyle.normal.borderColor = this.treeConfig.guts[
                'begin'
            ].borderColor;
            nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
                'begin'
            ].borderSize;

        } else if (data.nodeType == '剧情') {
            nodeData.symbol = this.treeConfig.guts['guts'].nonSave.symbol;
            nodeData.symbolSize = this.treeConfig.guts['guts'].nonSave.symbolSize;
            nodeData.itemStyle.normal.color = this.treeConfig.guts[
                'guts'
            ].nonSave.bgColor;
            nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
                'guts'
            ].nonSave.borderSize;
            // nodeData.attributes.modularity_class = '剧情';
        } else if (data.nodeType == '结局') {
            nodeData.symbol = this.treeConfig.guts['ending'].symbol;
            nodeData.symbolSize = this.treeConfig.guts['ending'].symbolSize;
            nodeData.itemStyle.normal.color = this.treeConfig.guts[
                'ending'
            ].bgColor;
            nodeData.itemStyle.normal.borderColor = this.treeConfig.guts[
                'ending'
            ].borderColor;
            nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
                'ending'
            ].borderSize;
        } 


        return nodeData;
    }

    _extend(target, obj) {
        Object.keys(obj).forEach(key => {
            if (_typeof(obj[key]) == "object") {
                if (target[key])
                    this._extend(target[key], obj[key])
            } else {
                target[key] = obj[key]
            }
        })
        return target
    }

    _typeof(o) {
        return Object.prototype.toString.call(o).slice(8, -1)
    }
}
