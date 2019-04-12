// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
import Global, { PokerType, PokeyColor } from './Global'
const { ccclass, property } = cc._decorator;
import Game from './Game'

@ccclass
export default class Card extends cc.Component {

    @property({
        displayName: '游戏主逻辑',
        visible: false
    })
    game: Game = null;

    @property({
        displayName: '值',
    })
    number: number = 1;

    @property({
        displayName: '小花色',
        type: cc.Sprite,
    })
    iconSmall: cc.Sprite = null;

    @property({
        displayName: '大花色',
        type: cc.Sprite,
    })
    iconBig: cc.Sprite = null;

    @property({
        displayName: '背景后',
        type: cc.Sprite,
    })
    bgBack: cc.Sprite = null;

    @property({
        displayName: '背景前',
        type: cc.Sprite,
    })
    bgFront: cc.Sprite = null;

    @property({
        displayName: '显示值',
        type: cc.Label,
    })
    showNumber: cc.Label = null;

    @property({
        displayName: '选中框',
        type: cc.Sprite,
    })
    selectSlot: cc.Sprite = null;

    @property({
        visible: false
    })
    type: PokerType = undefined;

    @property({
        visible: false
    })
    color: PokeyColor = undefined;

    @property({
        visible: false
    })
    isBack: boolean = false;

    @property({
        visible: false
    })
    touchBeginPostion: cc.Vec2;

    @property({
        visible: false
    })
    touchMovePostion: cc.Vec2;

    // onLoad () {}

    start() {
        this.initListener();
        this.selectSlot.enabled = false;
    }

    initListener() {
        let self = this;
        this.node.on(cc.Node.EventType.TOUCH_START, function (event: cc.Event.EventMouse) {
            if (!self.isBack) {
                self.node.parent.parent.zIndex = 100;
                self.node.parent.zIndex = 100;
                self.touchMovePostion = event.getLocation();
                self.touchBeginPostion = self.node.position;
                self.selectSlot.enabled = true;
                self.childrenFloat(true);
            }
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event: cc.Event.EventMouse) {
            if (!self.isBack) {
                let x = self.touchBeginPostion.x + (event.getLocationX() - self.touchMovePostion.x);
                let y = self.touchBeginPostion.y + (event.getLocationY() - self.touchMovePostion.y);
                self.setNewPostion(x, y);
            }
        }, this);

        this.node.on(cc.Node.EventType.TOUCH_END, function (event: cc.Event.EventMouse) {
            if (!self.isBack) {
                let x = self.touchBeginPostion.x + (event.getLocationX() - self.touchMovePostion.x);
                let y = self.touchBeginPostion.y + (event.getLocationY() - self.touchMovePostion.y);
                self.setNewPostion(x, y);
                self.node.parent.parent.zIndex = 0;
                self.node.parent.zIndex = 0;
                self.game.dropDownPocker(self);
                self.selectSlot.enabled = false;
                self.childrenFloat(false);
            }
        }, this);
    }

    setNewPostion(x: number, y: number) {
        this.node.setPosition(x, y);
        if (this.node.parent.parent.name == 'SlotBottom') {
            let socket = this.node.parent;
            let isHasChild = false;
            let j = 0;
            for (let i = 0; i < socket.childrenCount; i++) {

                if (isHasChild) {
                    j++;
                    socket.children[i].setPosition(this.node.position.x, this.node.position.y - j * Global.POCKER_SPACK);
                }
                if (socket.children[i] == this.node) {
                    isHasChild = true;
                }
            }
        }
    }


    initPocker(number: number, type: PokerType) {
        this.number = number;
        this.type = type;
        let stringArray = ['', '<', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';'];
        this.showNumber.string = stringArray[this.number];

        let filename = '';
        if (this.type == PokerType.FANGKUAI) {
            filename = 'puke_fangkuai';
            this.color = PokeyColor.RED;
        }
        else if (this.type == PokerType.HEITAO) {
            filename = 'puke_heitao';
            this.color = PokeyColor.BLACK;
            this.showNumber.node.color = cc.Color.BLACK;
        }
        else if (this.type == PokerType.HONGTAO) {
            filename = 'puke_hongtao';
            this.color = PokeyColor.RED;
        }
        else if (this.type == PokerType.MEIHUA) {
            filename = 'puke_meihua';
            this.color = PokeyColor.BLACK;
            this.showNumber.node.color = cc.Color.BLACK;
        }
        let self = this;
        cc.loader.loadRes(filename + '1', cc.SpriteFrame, function (err, spritFrame) {
            self.iconSmall.spriteFrame = spritFrame;
        });
        if (this.number == 11) {//J
            filename = this.color == PokeyColor.BLACK ? "puke_heiJ" : "puke_hongJ";
        }
        else if (this.number == 12) {//Q
            filename = this.color == PokeyColor.BLACK ? "puke_heiQ" : "puke_hongQ";
        }
        else if (this.number == 13) {//K
            filename = this.color == PokeyColor.BLACK ? "puke_heiK" : "puke_hongK";
        }
        else {
            self.iconBig.node.setPosition(self.iconBig.node.position.x - 5, self.iconBig.node.position.y + 5);
        }
        cc.loader.loadRes(filename, cc.SpriteFrame, function (err, spritFrame) {
            self.iconBig.spriteFrame = spritFrame;
        });

    }

    setGameLogic(game: Game) {
        this.game = game;
    }

    backGround(is: boolean) {
        this.isBack = is;
        this.showNumber.enabled = !this.isBack;
        this.iconBig.enabled = !this.isBack;
        this.iconSmall.enabled = !this.isBack;
        this.bgFront.enabled = !this.isBack;
    }

    positionReduction() {
        this.node.setPosition(this.touchBeginPostion);
    }

    pockerFloat(isFloat: boolean) {

        for (let i = 0; i < this.node.childrenCount; i++) {
            let child = this.node.children[i];
            let ox = child.x;
            let oy = child.y;
            if (child.name == "shadow") {
                if (isFloat) {
                    child.runAction(cc.moveTo(0.1, new cc.Vec2(ox + Global.POCKER_FLOAT, oy - Global.POCKER_FLOAT)));
                }
                else {
                    child.runAction(cc.moveTo(0.1, new cc.Vec2(ox - Global.POCKER_FLOAT, oy + Global.POCKER_FLOAT)));
                }
            }
            else {
                if (isFloat) {
                    child.runAction(cc.moveTo(0.1, new cc.Vec2(ox - Global.POCKER_FLOAT, oy + Global.POCKER_FLOAT)));
                }
                else {
                    child.runAction(cc.moveTo(0.1, new cc.Vec2(ox + Global.POCKER_FLOAT, oy - Global.POCKER_FLOAT)));
                }
            }
        }
    }

    childrenFloat(isFloat: boolean) {
        if (this.node.parent.parent.name == 'SlotBottom') {
            let socket = this.node.parent;
            let isHasChild = false;
            let j = 0;
            for (let i = 0; i < socket.childrenCount; i++) {
                if (socket.children[i] == this.node) {
                    isHasChild = true;
                }
                if (isHasChild) {
                    let pocker = socket.children[i].getComponent(Card);
                    pocker.pockerFloat(isFloat);
                }
            }
        }
        else {
            this.pockerFloat(isFloat);
        }
    }
    // update (dt) {}
}
