/**
 * 剧情分支树图标
 */

import echarts from echarts

class STChart {
    constructor(el) {
        this.el = el
        this.chart = null
        this.option = {
            title: {
                text: '',
                subtext: '',
                top: 'bottom',
                left: 'right'
            },
            xAxis: {
                type: 'value',
                show: false,
                min: 'dataMin',
                max: 'dataMax',
                splitLine: {
                    show: true
                }
            },
            yAxis: {
                type: 'value',
                show: false,
                min: 'dataMin',
                max: 'dataMax',
                splitLine: {
                    show: true
                }
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
                    if (data.data.dataSet && data.data.dataSet.canedit) {
                        let str = '';
                        str = str + '【名称】' + data.data.dataSet.name + '<br />';
                        str = str + `【章节】第${data.data.dataSet.chapter}章<br />`;
                        if (data.data.dataSet.selectors.length > 1) {
                            str = str + '【选项】' + '<br />';
                            data.data.dataSet.selectors.forEach((item, index) => {
                                str =
                                    str +
                                    '<span style="margin-left:1rem;color:#eaeaea" >第' +
                                    (index + 1) +
                                    '项:' +
                                    item.keywordsArr.join(',') +
                                    '</p><br />';
                            });
                        }
                        return str;
                    } else if (data.data.name) {
                        return data.data.name.join(',').replace('*', '[无选项]');
                    }
                }
            },
            series: [
                {
                    type: 'graph',
                    layout: 'none',
                    coordinateSystem: 'cartesian2d', //采用直角坐标系
                    symbolSize: [40, 15],
                    symbolOffset: [5, 0],
                    roam: 'move',
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
                    //   normal: {
                    //     textStyle: {
                    //       fontSize: 20
                    //     }
                    //   }
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
            copyEditor: ''
        }
        this.treeConfig = {
            yPositionSize: 3,
            xPositionSize: 5,
            edge: {
                style: ['none', 'arrow'],
                size: [0, 2]
            },
            line: {
                normal: {
                    opacity: 0.9,
                    width: 2,
                    curveness: 0
                }
            },
            lineTransparent: {
                normal: {
                    opacity: 0.3,
                    width: 2,
                    curveness: 0
                }
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
        return new STChart(el)
    }

    setOption() {
        this.chart = echarts.init(this.el)
        // todo 处理箭头数据

        this.chart.setOption(this.option)


    }

    _resizeGutNode() {
        // 按照position排序
        this.option.series[0].data.sort(function (a, b) {
            return a.dataSet.position - b.dataSet.position;
        });
        this.maxPosition =
            this.option.series[0].data[
                this.option.series[0].data.length - 1
            ].dataSet.position;

        this.option.series[0].data.sort(function (a, b) {
            if (a.dataSet.position != b.dataSet.position) {
                return a.dataSet.position - b.dataSet.position;
            } else if (a.dataSet.position == b.dataSet.position) {
                // 第一步：如果相同，按照 后续链接长度排序
                // 第二步：排序是围绕中心点，所以需要判断y值

                let nodesCount_a = 0;
                let nodesCount_b = 0;
                // let parentNodeY_a = 0;
                // let parentNodeY_b = 0;
                let parentSelectY_a = 0;
                let parentSelectY_b = 0;

                this.option.series[0].data.forEach((item) => {
                    // 剧情点
                    if (
                        item.dataSet.index.length > a.dataSet.index.length &&
                        item.dataSet.index.indexOf(a.dataSet.index) >= 0
                    ) {
                        nodesCount_a++;
                    }
                    if (
                        item.dataSet.index.length > b.dataSet.index.length &&
                        item.dataSet.index.indexOf(b.dataSet.index) >= 0
                    ) {
                        nodesCount_b++;
                    }
                    if (item.dataSet.pointTo == a.dataSet.id) {
                        parentSelectY_a = item.y;
                    }

                    if (item.dataSet.pointTo == b.dataSet.id) {
                        parentSelectY_b = item.y;
                    }
                });

                // 剧情
                if (parentSelectY_a * parentSelectY_b < 0) {
                    return parentSelectY_b - parentSelectY_a;
                } else if (
                    parentSelectY_a * parentSelectY_b > 0 &&
                    parentSelectY_a < 0
                ) {
                    return nodesCount_b - nodesCount_a;
                } else if (
                    parentSelectY_a * parentSelectY_b > 0 &&
                    parentSelectY_a > 0
                ) {
                    return nodesCount_a - nodesCount_b;
                } else {
                    return parentSelectY_a - parentSelectY_b;
                }
            }
        });

        this._repositionNodes();

        this._showTree('rezoom');
    }

    _repositionNodes() {
        let positonCount = new Map();
        // let positonSelectorCount = new Map();
        // 顺序调整结束

        let maxCount = 0;

        // 遍历每个列，计算每个position数目
        this.option.series[0].data.forEach(node => {
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

        this.option.series[0].data.forEach((node) => {
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

            node.x = node.dataSet.position * this.treeConfig.xPositionSize;
            node.y = parseInt(node.y);
            node.x = parseInt(node.x);
        });
    }

    _showTree() {
        this.chart.showLoading();

        this.option.series[0].data.forEach((data) => {
            data.value = [data.x, data.y];

            // 设置节点样式
            this._setGutsStyle(data);

            this.nodeMap.set(data.dataSet.id, data.dataSet);
        });

        // 调整dataZoom位置
        if (!this.option.dataZoom) this.option.dataZoom = this.treeConfig.dataZoom;
        // 如果节点少，那么隐藏底部滚动条
        if (this.maxPosition * this.treeConfig.xPositionSize <= 50) {
            this.option.dataZoom[0].show = false;
        } else {
            this.option.dataZoom[0].show = true;
            let option = this.chart.getOption();
            if (option) {
                this.option.dataZoom[0].startValue = option.dataZoom[0].startValue;
                let endValue = this.option.dataZoom[0].endValue = option.dataZoom[0].endValue;
                if (endValue > 99) this.option.dataZoom[0].endValue = this.maxPosition * this.treeConfig.xPositionSize + 10;
            }
        }

        // 重置进度条
        if (rezoom) {
            this.option.dataZoom[0].startValue = 0;
            this.option.dataZoom[0].endValue = 50;
        }

        // 调整X轴
        // console.log(this.maxPosition);
        this.option.xAxis.max =
            this.maxPosition * this.treeConfig.xPositionSize + 10;

        // 保存缓存
        localStorage.setItem('gameGutsOption', JSON.stringify(this.option));

        this.chart.on('click', function (params) {
            const index = params.dataIndex;
            const node = this.option.series[0].data[index];
            if (node.isOfNextChap) return;

            const dataSet = node.dataSet;
            this.copyEditor = dataSet;

            this.$emit('changeEditor', dataSet);
        });

        this.chart.on('mouseout', function (params) {
            let index = -1;

            if (
                !this.fullScreen &&
                this.copyEditor &&
                params.data.dataSet &&
                this.copyEditor.id === params.data.dataSet.id
            ) {
                if (
                    params.data.dataSet &&
                    params.data.dataSet.nodeType != '选项' &&
                    params.data.dataSet.id == this.copyEditor.id
                ) {
                    index = params.dataIndex;
                } else {
                    index = this.option.series[0].data.findIndex(function (item) {
                        return item.dataSet.id == this.copyEditor.id;
                    });
                }

                this.chart.dispatchAction({
                    type: 'focusNodeAdjacency',

                    // 使用 seriesId 或 seriesIndex 或 seriesName 来定位 series.
                    seriesIndex: 0,

                    // 使用 dataIndex 来定位节点。
                    dataIndex: index
                });
            }
        });

        this.chart.on('mouseover', function (params) {
            if (params.data.dataSet && params.data.dataSet.canedit) {
                params.seriesName = params.data.dataSet.description;
            }

            if (this.fullScreen) {
                if (params.data.dataSet && params.data.dataSet.nodeType != '选项') {
                    // 如果全屏模式，要处理hover
                    let targetDom =
                        this.$refs['fullTable'].$el.children[2].children[0].children[1]
                            .children[params.dataIndex];
                    this.hoverEditor = params.data.dataSet;
                    this.$refs['fullTable'].$el.children[2].scrollTop =
                        targetDom.offsetTop;
                    targetDom.click();
                }
            }
        });

        this.chart.hideLoading();
        this.chart.setOption(this.option);
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
          nodeData.attributes.modularity_class = '衔接点';
  
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
          nodeData.attributes.modularity_class = '开始';
  
          this.chapterMap.set(1, {
            chapter: 1,
            position: data.position,
            type: '上线',
            id: data.id
          });
        } else if (data.nodeType == '剧情' && data.canSave == 0) {
          nodeData.symbol = this.treeConfig.guts['guts'].nonSave.symbol;
          nodeData.symbolSize = this.treeConfig.guts['guts'].nonSave.symbolSize;
          nodeData.itemStyle.normal.color = this.treeConfig.guts[
            'guts'
          ].nonSave.bgColor;
          nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
            'guts'
          ].nonSave.borderSize;
          nodeData.attributes.modularity_class = '剧情';
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
  
          nodeData.attributes.modularity_class = '结局';
        } else if (data.nodeType == '剧情' && data.canSave == 1) {
          nodeData.symbol = this.treeConfig.guts['guts'].needSave.symbol;
          nodeData.symbolSize = this.treeConfig.guts['guts'].needSave.symbolSize;
          nodeData.itemStyle.normal.color = this.treeConfig.guts[
            'guts'
          ].needSave.bgColor;
          nodeData.itemStyle.normal.borderColor = this.treeConfig.guts[
            'guts'
          ].needSave.borderColor;
          nodeData.itemStyle.normal.borderSize = this.treeConfig.guts[
            'guts'
          ].borderSize;
          nodeData.attributes.modularity_class = '剧情:存档';
        }
  
        return nodeData;
      }
}