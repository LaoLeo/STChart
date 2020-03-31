/**
 * 剧情分支树图表
 */

import * as echarts from "echarts/src/echarts"
import "echarts/src/chart/graph"
// 引入提示框组件、标题组件、工具箱组件。
import 'echarts/src/component/tooltip';
// import 'echarts/src/component/title';
// import 'echarts/src/component/toolbox';
import { filterDialogsByChapter } from "./util"

export default class STChart {
    constructor(el) {
        this.el = el
        this.chart = null
        this.currChapter = 1
        this._defaultOpt = {
            // title: {
            //     text: '',
            //     subtext: '',
            //     top: 'bottom',
            //     left: 'right'
            // },
            xAxis: {
                type: 'value',
                show: true,
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
                show: true,
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
                    roam: true,
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
                    // filterMode: "empty",
                    xAxisIndex: [0],
                    // backgroundColor: "rgba(17,135,255,0.35)",
                    // fillerColor: "rgba(129, 192, 255,1)",
                    startValue: 0,
                    endValue: 50,
                    minValueSpan: 40,
                    maxValueSpan: 200,
                    showDetail: false,

                    // height: 8,
                    // bottom: 20,
                    // borderColor: 'transparent',
                    // backgroundColor: '#e2e2e2',
                    // handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z M13.3,22H6.7v-1.2h6.6z M13.3,19.6H6.7v-1.2h6.6z', // jshint ignore:line
                    // handleSize: 20,
                    // handleStyle: {
                    //   shadowBlur: 6,
                    //   shadowOffsetX: 1,
                    //   shadowOffsetY: 2,
                    //   shadowColor: '#aaa'
                    // }

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
        this.renderStory()
    }

    renderStory() {
        let graphSeries = this._defaultOpt.series[0]

        let chartData = filterDialogsByChapter(this.currChapter)
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
                // chapterType: data.dataType ? data.dataType : '剧情',
                isOfNextChap: this.currChapter !== data.chapter,
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
        // let positonSelectorCount = new Map();
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
        // let positonSelectorCount_Used = new Map();

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

        // 保存缓存
        // localStorage.setItem('gameGutsOption', JSON.stringify(this._defaultOpt));

        this.chart.on('click', function (params) {
            alert("click")
            console.warn(params)
        });

        // this.chart.on('mouseout', function (params) {
        //     let index = -1;

        //     if (
        //         !this.fullScreen &&
        //         this.copyEditor &&
        //         params.data.dataSet &&
        //         this.copyEditor.id === params.data.dataSet.id
        //     ) {
        //         if (
        //             params.data.dataSet &&
        //             params.data.dataSet.nodeType != '选项' &&
        //             params.data.dataSet.id == this.copyEditor.id
        //         ) {
        //             index = params.dataIndex;
        //         } else {
        //             index = this._defaultOpt.series[0].data.findIndex(function (item) {
        //                 return item.dataSet.id == this.copyEditor.id;
        //             });
        //         }

        //         this.chart.dispatchAction({
        //             type: 'focusNodeAdjacency',

        //             // 使用 seriesId 或 seriesIndex 或 seriesName 来定位 series.
        //             seriesIndex: 0,

        //             // 使用 dataIndex 来定位节点。
        //             dataIndex: index
        //         });
        //     }
        // });

        // this.chart.on('mouseover', function (params) {
        //     if (params.data.dataSet && params.data.dataSet.canedit) {
        //         params.seriesName = params.data.dataSet.description;
        //     }

        //     if (this.fullScreen) {
        //         if (params.data.dataSet && params.data.dataSet.nodeType != '选项') {
        //             // 如果全屏模式，要处理hover
        //             let targetDom =
        //                 this.$refs['fullTable'].$el.children[2].children[0].children[1]
        //                     .children[params.dataIndex];
        //             this.hoverEditor = params.data.dataSet;
        //             this.$refs['fullTable'].$el.children[2].scrollTop =
        //                 targetDom.offsetTop;
        //             targetDom.click();
        //         }
        //     }
        // });

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
            // nodeData.attributes.modularity_class = '开始';

            // this.chapterMap.set(1, {
            //     chapter: 1,
            //     position: data.position,
            //     type: '上线',
            //     id: data.id
            // });
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

            // nodeData.attributes.modularity_class = '结局';
        } 
        // else if (data.nodeType == '剧情' && data.canSave == 1) {
        //     nodeData.symbol = this.treeConfig.guts['guts'].needSave.symbol;
        //     nodeData.symbolSize = this.treeConfig.guts['guts'].needSave.symbolSize;
        //     nodeData.itemStyle.normal.color = this.treeConfig.guts[
        //         'guts'
        //     ].needSave.bgColor;
        //     nodeData.itemStyle.normal.borderColor = this.treeConfig.guts[
        //         'guts'
        //     ].needSave.borderColor;
        //     nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
        //         'guts'
        //     ].borderSize;
        //     // nodeData.attributes.modularity_class = '剧情:存档';
        // }

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
        return Object.prototype.toString.call(o).substr(8, -1)
    }
}
