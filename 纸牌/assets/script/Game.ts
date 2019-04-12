// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;
import Global, { PokerType } from './Global'
import Pocker from './Poker'
import Utils from './Utils'

@ccclass
export default class Game extends cc.Component {

    @property({
        displayName: '扑克控件',
        type: cc.Prefab
    })
    perfabPocker: cc.Prefab = null;

    @property({
        displayName: '发牌卡槽',
        type: cc.Node
    })
    socketStart: cc.Node = null;

    @property({
        displayName: '上部卡槽',
        type: cc.Node
    })
    socketTop: cc.Node = null;

    @property({
        displayName: '下部卡槽',
        type: cc.Node
    })
    socketBottom: cc.Node = null;

    // onLoad () {}
    start() {
        this.initListener();
        this.initGame();
    }

    /**
     * 初始化游戏
     */
    initGame() {
        let nodeStar = this.socketStart.getChildByName('NodeStart');
        // 生成52张牌的数据
        let count = 52;
        let allPockers = new Array(count);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 13; j++) {
                let index = i * 13 + j;
                allPockers[index] = {
                    number: j + 1,
                    type: i,
                };
            }
        }
        // 生成牌的实体
        let types = [PokerType.FANGKUAI, PokerType.HEITAO, PokerType.HONGTAO, PokerType.MEIHUA];
        for (let i = 0; i < count; i++) {
            let num = Utils.RandomNumber(0, allPockers.length - 1);
            let newPocker = cc.instantiate(this.perfabPocker);
            let pockerScript = newPocker.getComponent(Pocker);
            let pockerNumber = allPockers[num].number;
            let pockerType = allPockers[num].type;
            pockerScript.setGameLogic(this);
            pockerScript.initPocker(pockerNumber, pockerType);
            pockerScript.backGround(true);
            newPocker.setPosition(0, 0);
            nodeStar.addChild(newPocker);
            allPockers.splice(num, 1);
        }
        // 随机洗牌
        let timeDelay = 0;
        for (let i = 0; i < 7; i++) {
            let socket = this.socketBottom.children[i];
            for (let j = 0; j < i + 1; j++) {
                let pocker = nodeStar.children[nodeStar.children.length - 1];

                // 发牌动画
                let p1 = pocker.convertToWorldSpace(new cc.Vec2(0, 0));
                let p2 = socket.convertToNodeSpace(p1);
                pocker.setParent(socket);
                pocker.setPosition(p2);
                let p3 = new cc.Vec2(0, j * -Global.POCKER_SPACK);
                pocker.runAction(cc.sequence(cc.delayTime(timeDelay), cc.moveTo(0.07, p3)));
                timeDelay += 0.1;
                let pockerScript = pocker.getComponent(Pocker);
                pockerScript.backGround(j < i);
            }
        }
    }


    /**
     * 点牌事件监控器
     */
    initListener() {
        let self = this;
        let nodeStar = this.socketStart.getChildByName('NodeStart');
        nodeStar.on(cc.Node.EventType.MOUSE_DOWN, function () {
            self.openNewPockerInDock();
        }, this);
    }

    dropDownPocker(pocker: Pocker) {
        // 放在下部区域
        for (let i = 0; i < this.socketBottom.childrenCount; i++) {
            let socket = this.socketBottom.children[i];
            if (pocker.node.parent == socket) {
                continue;
            }
            if (socket.children.length > 0) {//有牌的列
                let lastPockerNode = socket.children[socket.children.length - 1];
                let lastPockerScript = lastPockerNode.getComponent(Pocker);
                if (lastPockerScript != pocker) {
                    if (Utils.RectApproach(pocker.node, lastPockerNode)) {
                        if (this.isAbleOnPocker(pocker, lastPockerScript)) {
                            let oldSocket = pocker.node.parent;
                            this.setPockerInSocket(pocker, socket);
                            this.openNewPockerInSocket(oldSocket);
                            return;
                        }
                    }
                }
            }
            else {//无牌的列
                if (Utils.RectApproach(pocker.node, socket)) {
                    if (this.isAbleOnBottom(pocker, socket)) {
                        let oldSocket = pocker.node.parent;
                        this.setPockerInSocket(pocker, socket);
                        this.openNewPockerInSocket(oldSocket);
                        return;
                    }
                }
            }
        }
        // 放在上部区域
        for (let i = 0; i < this.socketTop.childrenCount; i++) {
            let socket = this.socketTop.children[i];
            if (pocker.node.parent == socket) {
                continue;
            }
            if (Utils.RectApproach(pocker.node, socket)) {
                if (this.isAbleOnTop(pocker, socket)) {
                    let oldSocket = pocker.node.parent;
                    this.setPockerInSocket(pocker, socket);
                    this.openNewPockerInSocket(oldSocket);
                    return;
                }
            }
        }
        // 没有可放区域，回到原来位置
        this.positionReduction(pocker);
    }
    /**
     * 放牌条件判断，下部，花色相异，数值差一
     * @param pocker1 要放的牌
     * @param pocker2 上面的牌
     */
    isAbleOnPocker(pocker1: Pocker, pocker2: Pocker) {
        return pocker1.color != pocker2.color && pocker1.number == pocker2.number - 1;
    }

    /**
     * 放牌条件判断，下部，空档，放K牌
     * @param pocker1 要放的牌
     * @param socket 档位
     */
    isAbleOnBottom(pocker1: Pocker, socket: cc.Node) {
        return pocker1.number == 13 && socket.childrenCount == 0;
    }

    /**
     *  放牌条件判断，上部，空档放A牌或放同色相差一的牌
     * @param pocker1 要放的牌
     * @param socket 档位
     */
    isAbleOnTop(pocker1: Pocker, socket: cc.Node) {
        if (socket.childrenCount == 0 && pocker1.number == 1) {
            return true;
        }
        else if (socket.childrenCount > 0) {
            let lastPockerNode = socket.children[socket.children.length - 1];
            let lastPockerScript = lastPockerNode.getComponent(Pocker);
            if (pocker1.type == lastPockerScript.type && pocker1.number == lastPockerScript.number + 1) {
                return true;
            }
        }
        return false;
    }

    setPockerInSocket(pocker: Pocker, socket: cc.Node) {
        if (socket.parent == this.socketBottom) {

            let oldSocket = pocker.node.parent;
            let isHasChild = false;
            let array = new Array();
            for (let i = 0; i < oldSocket.childrenCount; i++) {
                if (oldSocket.children[i] == pocker.node) {
                    isHasChild = true;
                }
                if (isHasChild) {
                    array.push(oldSocket.children[i]);
                }
            }
            //动画
            for (let i = 0; i < array.length; i++) {
                let onePocker: cc.Node = array[i];
                let p1 = onePocker.convertToWorldSpace(new cc.Vec2(0, 0));
                let p2 = socket.convertToNodeSpace(p1);
                onePocker.setParent(socket);
                onePocker.setPosition(p2);
            }
            let y = 0;
            let isHasBack = true;
            for (let i = 0; i < socket.childrenCount; i++) {
                let pocker = socket.children[i].getComponent(Pocker);
                let action = cc.moveTo(0.1, new cc.Vec2(0, y));
                if (!pocker.isBack && isHasBack) {
                    isHasBack = false;
                }
                let per = isHasBack ? 0 : 0.7;
                y -= (Global.POCKER_SPACK + (Global.POCKER_SPACK * per));
                socket.children[i].runAction(action);
            }
        }
        else if (socket.parent == this.socketTop) {
            //动画
            let p1 = pocker.node.convertToWorldSpace(new cc.Vec2(0, 0));
            let p2 = socket.convertToNodeSpace(p1);
            pocker.node.setParent(socket);
            pocker.node.setPosition(p2);
            let action = cc.moveTo(0.1, new cc.Vec2(0, 0));
            pocker.node.runAction(action);
        }
    }

    /**
     * 下部的牌移走后，新翻一张档位的牌
     * @param socket 下部的档位
     */
    openNewPockerInSocket(socket: cc.Node) {
        if (socket.parent == this.socketBottom) {
            if (socket.children.length > 0) {
                let lastPockerNode = socket.children[socket.children.length - 1];
                let lastPockerScript = lastPockerNode.getComponent(Pocker);
                lastPockerScript.backGround(false);
            }
        }
    }

    openNewPockerInDock() {
        let nodeStart = this.socketStart.getChildByName('NodeStart');
        let nodeOpened = this.socketStart.getChildByName('NodeOpened');
        if (nodeStart.childrenCount > 0) {//牌堆里还有牌
            let pockerOpen = nodeStart.children[nodeStart.childrenCount - 1];
            let pockerScript = pockerOpen.getComponent(Pocker);
            pockerScript.backGround(false);
            pockerOpen.setParent(nodeOpened);
            //动画
            let ox = nodeOpened.getPosition().x - nodeStart.getPosition().x
            let oy = nodeOpened.getPosition().y - nodeStart.getPosition().y
            pockerOpen.setPosition(pockerOpen.x - ox, pockerOpen.y - oy);
            let action = cc.moveTo(0.1, new cc.Vec2(0, 0));
            pockerOpen.runAction(action);
        }
        else {
            for (let i = nodeOpened.childrenCount - 1; i >= 0; i--) {
                let pockerOpen = nodeOpened.children[i];
                let pockerScript = pockerOpen.getComponent(Pocker);
                pockerScript.backGround(true);
                pockerOpen.setParent(nodeStart);
                //动画
                let ox = nodeStart.getPosition().x - nodeOpened.getPosition().x
                let oy = nodeStart.getPosition().y - nodeOpened.getPosition().y
                pockerOpen.setPosition(pockerOpen.x - ox, pockerOpen.y - oy);
                let action1 = cc.moveTo(0.1, new cc.Vec2(0, 0));
                let action2 = cc.delayTime(i * 0.01);
                let action3 = cc.sequence(action2, action1);
                pockerOpen.runAction(action3);
            }
        }
    }

    /**
     * 放下牌时，无条件放置，返回原位
     * @param pocker 要放回的牌
     */
    positionReduction(pocker: Pocker) {
        let oldSocket = pocker.node.parent;
        if (oldSocket.parent == this.socketBottom) {//原先在底部

            let isHasChild = false;
            let array = new Array();
            for (let i = 0; i < oldSocket.childrenCount; i++) {
                if (oldSocket.children[i] == pocker.node) {
                    isHasChild = true;
                }
                if (isHasChild) {
                    let action = cc.moveTo(0.1, new cc.Vec2(0, -i * Global.POCKER_SPACK));
                    oldSocket.children[i].runAction(action);
                }
            }
        }
        else {//在上部
            let action = cc.moveTo(0.1, new cc.Vec2(0, 0));
            pocker.node.runAction(action);
        }
    }

    startNewGame() {
        for (let i = 0; i < this.socketBottom.childrenCount; i++) {
            this.socketBottom.children[i].removeAllChildren();
        }
        for (let i = 0; i < this.socketStart.childrenCount; i++) {
            this.socketStart.children[i].removeAllChildren();
        }
        for (let i = 0; i < this.socketTop.childrenCount; i++) {
            this.socketTop.children[i].removeAllChildren();
        }
        this.initGame();
    }
    // update (dt) {}
}
