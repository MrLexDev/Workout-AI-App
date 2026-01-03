export interface BodyPartPath {
    left?: string[];
    right?: string[];
    common?: string[];
}

export interface BodyPart {
    slug: string;
    path: BodyPartPath;
    color?: string;
}

export * from './bodyFront';
export * from './bodyBack';
