import { Vector2Like } from 'three';
import { IOutlet } from './IOutlet';
import { isOutlet } from './isOutlet';

export type Connection = {
    from: IOutlet;
    to: IOutlet | Vector2Like;
};

export type OuletCandidate = {
    outlet: IOutlet;
    alignmentScore: number;
};

export class ConnectionsArray<T extends Connection = Connection> {
    private _array: T[] = [];

    get array(): T[] {
        return this._array;
    }

    private connect(connection: Connection) {
        const other = connection.to;
        if (isOutlet(other)) {
            connection.from.connectedTo = other;
            other.connectedTo = connection.from;

            const inputOutlet = other.isInput ? other : connection.from;

            //
            // Only input outlets MIGHT change type based on to whom they are connected. Since output outlets only look at their own node's return type.
            //
            inputOutlet.updateType();

            //
            // and now tell the node to update since something was connected to it...
            //
            inputOutlet.owner.update();
        }
    }

    private disconnect(connection: Connection) {
        if (isOutlet(connection.to)) {
            const inputNode = connection.to.isInput
                ? connection.to
                : connection.from;

            connection.to.connectedTo = undefined;
            connection.from.connectedTo = undefined;

            inputNode.updateType();

            //
            // when we unplug from a node, that node will lose an input, so it needs to be updated.
            //
            inputNode.owner.update();
        }
    }

    push(...items: T[]): number {
        const result = this._array.push(...items);

        items.forEach((connection) => this.connect(connection));

        return result;
    }

    pop(): T | undefined {
        const result = this._array.pop();

        if (result) {
            this.disconnect(result);
        }

        return result;
    }

    splice(start: number, deleteCount?: number, ...items: T[]) {
        const result = this._array.splice(start, deleteCount ?? 0, ...items);

        if (deleteCount) {
            result.forEach((connection) => this.disconnect(connection));
        }

        items.forEach((connection) => this.connect(connection));

        return this;
    }

    filter(
        filterer: (connection: T, index: number, connections: T[]) => boolean,
    ) {
        const filtered = this._array.filter((connection, i, arr) => {
            const ok = filterer(connection, i, arr);
            // if(!ok) {
            //     this.disconnect( connection );
            // }
            return ok;
        });
        return filtered;
    }

    map<B>(mapper: (connection: T, index: number, connections: T[]) => B): B[] {
        return this._array.map(mapper);
    }

    find(finder: (connection: T, index: number, connections: T[]) => boolean) {
        for (let i = 0; i < this._array.length; i++) {
            const connection = this._array[i];
            if (finder(connection, i, this._array)) {
                return connection;
            }
        }
    }

    purge(judge: (connection: T) => boolean) {
        this._array = this._array.filter((con) => {
            const ok = judge(con);
            if (!ok) {
                this.disconnect(con);
            }
            return ok;
        });
        return this;
    }

    setOrphansTarget(target: IOutlet | Vector2Like) {
        this._array
            .filter((connection) => !isOutlet(connection.to))
            .forEach((orphan) => {
                orphan.to = target;
                this.connect(orphan);
            });
    }

    forEach(looper: (connection: T, index: number) => void) {
        this._array.forEach(looper);
    }

    *[Symbol.iterator](): Iterator<T> {
        yield* this._array;
    }

    get length(): number {
        return this._array.length;
    }

    reset() {
        while (this.pop()) {}
    }
}
