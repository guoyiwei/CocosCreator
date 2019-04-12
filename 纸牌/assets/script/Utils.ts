export default class Utils {
    static RectApproach(node1: cc.Node, node2: cc.Node) {
        let v1 = node1.convertToWorldSpace(new cc.Vec2(0, 0));
        let v2 = new cc.Vec2(v1.x + node1.width, v1.y);
        let v3 = new cc.Vec2(v1.x, v1.y + node1.height);
        let v4 = new cc.Vec2(v1.x + node1.width, v1.y + node1.height);

        let vx = node2.convertToWorldSpace(new cc.Vec2(0, 0));
        let rect = new cc.Rect(vx.x, vx.y, node2.width, node2.height);

        let c1 = rect.contains(v1);
        let c2 = rect.contains(v2);
        let c3 = rect.contains(v3);
        let c4 = rect.contains(v4);
        return c1 || c2 || c3 || c4;
    }

    static RandomNumber(minNum: number, maxNum: number) {
        let num = Math.random() * (maxNum - minNum + 1) + minNum
        return parseInt(num.toString(), 10);
    }
}