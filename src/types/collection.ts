import type { Product } from './product';

export interface Look {
lookImageUrl: string;
productIds: number[];
}

export interface Collection {
id: number;
name: string;
slug: string;
description: string;
imageUrl: string;
look: Look;
}