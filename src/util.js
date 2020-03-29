const processDialogs = []
const NODE_TYPE_TEXT = {
    1: '开始',
    2: '剧情',
    3: '结局',
    // 4: '开始', // 就是这么奇葩。。。 (废弃))
    // 5: '预告' 
};
const CHAP_STATUS = {
    PRE: 1, // 预告
    ONLINE: 2 // 上线
}
const DIALOG_NODE_TYPE = {
    begin: 1,
    dialog: 2,
    end: 3
}


export function filterDialogsByChapter(chapter = 1) {
    const dialogs = processDialogs.filter(
        d => d.chapter === chapter
    );
    // 衔接点
    const dialogsInNextChap = getDialogsOfNextChapter(
        dialogs,
        processDialogs
    );

    let dialogTreeDatas = genDialogTree(processDialogs);
    let f_data = formatData(
        chapter,
        [...dialogs, ...dialogsInNextChap],
        dialogTreeDatas,
        processDialogs
    );


    return {
        datas: f_data.dioDatas.nodes,
        links: f_data.dioDatas.links
    };
}


function formatData(chapter, dioDatas, dialogTreeDatas, processDialogs) {
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

    dioDatas.forEach((value) => {
        // 格式化树
        // 先格式化连线，有连线的节点才推入
        // 只推入关键属性，展示属性在工具 vue中设定


        if (value.analyses) {
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

    value.analyses.forEach((analyse) => {

        if (analyse.propsAnalyses) {

            analyse.propsAnalyses.forEach((link, index) => {

                // 检验完整
                let check = -1;
                check = dioDatas.findIndex(function (item) {
                    return item.dialogId == link.nextDialogId;
                });

                if (check >= 0) {

                    // 选项->下一节点
                    links.push({
                        'id': value.dialogId + '-' + link.nextDialogId,
                        'name': analyse.keywords,
                        'source': value.dialogId,
                        'target': link.nextDialogId
                    });
                }
            });

        } else if (analyse.nextDialogId) {
            // 兼容无道具

            // 检验完整
            let check = -1;
            check = dioDatas.findIndex(function (item) {
                return item.dialogId == analyse.nextDialogId;
            });

            if (check >= 0) {

                // 选项->下一节点
                links.push({
                    'id': value.dialogId + '-' + analyse.nextDialogId,
                    'name': analyse.keywords,
                    'source': value.dialogId,
                    'target': analyse.nextDialogId
                });
            }
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

        // 章节的第一个节点类型默认为存档类型，且不能修改
        isChapFirstNode = treeNode.parents.some(d => d.chapter !== dialog.chapter);
        isChapFirstNode && (dialog.record = 1);
    }

    let node = {
        id: dialog.dialogId,
        corpusIds: dialog.corpusIds,
        description: dialog.description,
        name: dialog.name,
        chapter: dialog.chapter,
        selectedRole: dialog.roleId,
        errorCorpusIds: (dialog.rePromptCorpusId && dialog.rePromptCorpusId > 0) ? [dialog.rePromptCorpusId] : (dialog.errorCorpusIds ? dialog.errorCorpusIds : []),
        robotAutoSelectCorpusId: (dialog.robotAutoSelectCorpusId && dialog.robotAutoSelectCorpusId > 0) ? [dialog.robotAutoSelectCorpusId] : [],
        autoSelectCorpusId: (dialog.autoSelectCorpusId && dialog.autoSelectCorpusId > 0) ? [dialog.autoSelectCorpusId] : [],
        winner: dialog.winner || [],
        canedit: true,
        index: treeNode ? treeNode.index : dialog.dialogId,
        points: treeNode ? treeNode.parents.length : 0,
        deepLevel: treeNode ? treeNode.deepLevel : 0, // 在composeProcessDialogs中会用到
        position: posMap[dialog.dialogId],
        canSave: !!dialog.record,
        saveDataSet: dialog.saveDataSet || 0, // 数据存档标记
        isChapFirstNode,
        nodeType: NODE_TYPE_TEXT[dialog.type],
        type: dialog.type,
        display: dialog.display,
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
            robotAutoSelectCorpusId: [],
            autoSelectCorpusId: [],
            description: '这是一个故事的开头，播完会进入第一个剧情',
            name: '开头',
            type: 1,
            chapter: 1,
            record: 0,
            points: 0,
            deepLevel: 0,
            analyses: [{
                keywords: ['*'],
                propsAnalyses: [{

                    nextDialogId: `d_${nextId}`,
                    hasProps: 1,
                    propsId: null,
                    gainPropsId: null,
                }]
            }]
        },
        {
            dialogId: `d_${nextId}`,
            type: 2,
            chapter: 1,
            robotAutoSelectCorpusId: [],
            autoSelectCorpusId: [],
            description: '这是故事的第一个剧情，完成后用户可以开始进行选择。这也是一个存档点，用户再次进入游戏时会跳过开头从这里开始',
            name: '1-1:剧情',
            record: 1,
            // nodeType: '剧情',
            points: 1,
            deepLevel: 1,
            analyses: []
        }
        ];
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
    dioDatas.filter(d => !!(d.analyses))
        .forEach(d => {
            let ids = d.analyses.filter(a => !!a.propsAnalyses).map(a => a.propsAnalyses.map(p => p.nextDialogId));
            let nextDialogIds = [];
            ids.forEach(item => (nextDialogIds = [...nextDialogIds, ...item]));
            nextIds = [...nextDialogIds, ...nextIds];
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
    let currChapDialog = processDialogs.filter(d => (d.chapter === currChapNo));
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

    return [...(new Set(result))].filter(d => !!d);
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
    let timestamp = String(Date.now());
    let offset = Math.floor(Math.random() * (timestamp.length - 3));
    let id = timestamp.slice(offset, offset + 3);

    return id;
}

// 获取剧情点的下一级子节点的id
function getNextDialogIds(dialog) {
    let nextIds = [];
    if (dialog.analyses) {
        dialog.analyses.forEach(item => {
            if (item.propsAnalyses) {
                let nIds = item.propsAnalyses.map(p => p.nextDialogId);
                nextIds = [...nextIds, ...nIds];
            }
        });
    }

    return nextIds.filter(id => (id !== '' && id !== '-1'));

}