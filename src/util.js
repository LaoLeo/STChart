const processDialogs = []
const NODE_TYPE_TEXT = {
    1: '开始',
    2: '剧情',
    3: '结局',
};
// const CHAP_STATUS = {
//     PRE: 1, // 预告
//     ONLINE: 2 // 上线
// }
const DIALOG_NODE_TYPE = {
    begin: 1,
    dialog: 2,
    end: 3
}

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

export function filterDialogsByChapter(chapter = 1) {
    const dialogs = processDialogs.filter(
        d => d.chapter === chapter
    );
    // 衔接点
    const dialogsInNextChap = getDialogsOfNextChapter(
        dialogs,
        processDialogs
    );

    let f_data = formatData(
        chapter,
        [...dialogs, ...dialogsInNextChap],
        processDialogs
    );


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

    dioDatas.forEach((value) => {
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

    value.children.forEach((nextDialogId) => {
        // 检验完整
        let check = -1;
        check = dioDatas.findIndex(function (item) {
            return item.dialogId == nextDialogId;
        });

        if (check >= 0) {
            // 选项->下一节点
            links.push({
                id: value.dialogId + '-' + nextDialogId,
                name: "name:" + value.dialogId + '-' + nextDialogId,
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
        },
        {
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
    dioDatas.filter(d => !!d.children)
        .forEach(d => {
            nextIds = [...nextIds, ...d.children]
        })

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
    let randomStr = Math.random().toString(36);
    let offset = Math.floor(Math.random() * (randomStr.length - 3));
    let id = randomStr.slice(offset, offset + 3);

    return id;
}

// 获取剧情点的下一级子节点的id
function getNextDialogIds(dialog) {
    return (dialog.children || []).filter(id => (id !== '' && id !== '-1'));

}