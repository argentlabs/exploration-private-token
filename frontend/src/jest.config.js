// jest.config.js
module.exports = {
    // ... other config
    extensionsToTreatAsEsm: ['.js', '.jsx', '.ts', '.tsx'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': [
            'babel-jest',
            {
                presets: [
                    ['@babel/preset-env', { targets: { node: 'current' } }],
                    '@babel/preset-react',
                ],
            },
        ],
    },
    transformIgnorePatterns: [
        "node_modules/(?!(@zk-kit/baby-jubjub|@zk-kit/utils)/)"
    ]
};