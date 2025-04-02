import { DraggableNumber } from "../../components/DraggableNumber";
import { DraggableValue } from "../../components/DraggableValue";
import { Output } from "../../properties/Output";
import { InputBaseNode } from "./InputBaseNode";
import { UniformBaseNode } from "./UniformBaseNode";

/**
 * A number, either a float or an int...
 */
export class ValueNode extends UniformBaseNode {

    protected inputValue: DraggableNumber;

    constructor() {

        super("number", [ new DraggableNumber("", () => this.update())]);

        this.inputValue = this.getChildOfType(DraggableNumber)!;
    }


    protected override getUniformJsValue(): string {
        return this.inputValue.stringValue;
    }

    override serialize(): Record<string, any> {
        return {
            ...super.serialize(),
            value: this.inputValue.value
        }
    }

    override unserialize(data: Record<string, any>): void {
        super.unserialize(data);
        this.inputValue.value = Number( data.value );
    }
}