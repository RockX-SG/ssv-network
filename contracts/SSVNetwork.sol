// File: contracts/SSVNetwork.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./ISSVNetwork.sol";

contract SSVNetwork is ISSVNetwork {
    uint256 public operatorCount;
    uint256 public validatorCount;

    mapping(bytes => Operator) public override operators;
    mapping(bytes => Validator) internal validators;

    mapping(bytes => uint256) internal validatorsPerOperator;

    uint256 public validatorsPerOperatorLimit;

    modifier onlyValidator(bytes calldata _publicKey) {
        require(
            validators[_publicKey].ownerAddress != address(0),
            "Validator with public key is not exists"
        );
        require(msg.sender == validators[_publicKey].ownerAddress, "Caller is not validator owner");
        _;
    }

    modifier onlyOperator(bytes calldata _publicKey) {
        require(
            operators[_publicKey].ownerAddress != address(0),
            "Operator with public key is not exists"
        );
        require(msg.sender == operators[_publicKey].ownerAddress, "Caller is not operator owner");
        _;
    }

    function _validateValidatorParams(
        bytes calldata _publicKey,
        bytes[] calldata _operatorPublicKeys,
        bytes[] calldata _sharesPublicKeys,
        bytes[] calldata _encryptedKeys
    ) private pure {
        require(_publicKey.length == 48, "Invalid public key length");
        require(
            _operatorPublicKeys.length == _sharesPublicKeys.length &&
                _operatorPublicKeys.length == _encryptedKeys.length,
            "OESS data structure is not valid"
        );
    }

    /**
     * @dev See {ISSVNetwork-addOperator}.
     */
    function addOperator(
        string calldata _name,
        address _ownerAddress,
        bytes calldata _publicKey
    ) public virtual override {
        require(
            operators[_publicKey].ownerAddress == address(0),
            "Operator with same public key already exists"
        );

        operators[_publicKey] = Operator(_name, _ownerAddress, _publicKey, 0);

        emit OperatorAdded(_name, _ownerAddress, _publicKey);

        operatorCount++;
    }

    /**
     * @dev See {ISSVNetwork-addValidator}.
     */
    function addValidator(
        address _ownerAddress,
        bytes calldata _publicKey,
        bytes[] calldata _operatorPublicKeys,
        bytes[] calldata _sharesPublicKeys,
        bytes[] calldata _encryptedKeys
    ) public virtual override {
        _validateValidatorParams(
            _publicKey,
            _operatorPublicKeys,
            _sharesPublicKeys,
            _encryptedKeys
        );
        require(_ownerAddress != address(0), "Owner address invalid");
        require(
            validators[_publicKey].ownerAddress == address(0),
            "Validator with same public key already exists"
        );

        Validator storage validatorItem = validators[_publicKey];
        validatorItem.publicKey = _publicKey;
        validatorItem.ownerAddress = _ownerAddress;

        for (uint256 index = 0; index < _operatorPublicKeys.length; ++index) {
            validatorItem.oess.push(
                Oess(
                    index,
                    _operatorPublicKeys[index],
                    _sharesPublicKeys[index],
                    _encryptedKeys[index]
                )
            );

            require(++validatorsPerOperator[_operatorPublicKeys[index]] <= validatorsPerOperatorLimit, "exceed validator limit");
        }

        validatorCount++;
        emit ValidatorAdded(_ownerAddress, _publicKey, validatorItem.oess);
    }

    /**
     * @dev See {ISSVNetwork-updateValidator}.
     */
    function updateValidator(
        bytes calldata _publicKey,
        bytes[] calldata _operatorPublicKeys,
        bytes[] calldata _sharesPublicKeys,
        bytes[] calldata _encryptedKeys
    ) onlyValidator(_publicKey) public virtual override {
        _validateValidatorParams(
            _publicKey,
            _operatorPublicKeys,
            _sharesPublicKeys,
            _encryptedKeys
        );
        Validator storage validatorItem = validators[_publicKey];

        for (uint256 index = 0; index < validatorItem.oess.length; ++index) {
            if (validatorsPerOperator[validatorItem.oess[index].operatorPublicKey] > 0) {
                --validatorsPerOperator[validatorItem.oess[index].operatorPublicKey];
            }
        }

        delete validatorItem.oess;

        for (uint256 index = 0; index < _operatorPublicKeys.length; ++index) {
            validatorItem.oess.push(
                Oess(
                    index,
                    _operatorPublicKeys[index],
                    _sharesPublicKeys[index],
                    _encryptedKeys[index]
                )
            );

            require(++validatorsPerOperator[_operatorPublicKeys[index]] <= validatorsPerOperatorLimit, "exceed validator limit");
        }

        emit ValidatorUpdated(validatorItem.ownerAddress, _publicKey, validatorItem.oess);
    }

    /**
     * @dev See {ISSVNetwork-deleteValidator}.
     */
    function deleteValidator(
        bytes calldata _publicKey
    ) onlyValidator(_publicKey) public virtual override {
        Validator storage validatorItem = validators[_publicKey];

        for (uint256 index = 0; index < validatorItem.oess.length; ++index) {
            if (validatorsPerOperator[validatorItem.oess[index].operatorPublicKey] > 0) {
                --validatorsPerOperator[validatorItem.oess[index].operatorPublicKey];
            }
        }

        delete validators[_publicKey];
        validatorCount--;
        emit ValidatorDeleted(msg.sender, _publicKey);
    }

    /**
     * @dev See {ISSVNetwork-deleteOperator}.
     */
    function deleteOperator(
        bytes calldata _publicKey
    ) onlyOperator(_publicKey) public virtual override {
        string memory name = operators[_publicKey].name;
        delete operators[_publicKey];
        operatorCount--;
        emit OperatorDeleted(name, _publicKey);
    }

    function setValidatorsPerOperatorLimit(uint256 _validatorsPerOperatorLimit) external {
        // TODO: set real addresses
        require(msg.sender == 0x45E668aba4b7fc8761331EC3CE77584B7A99A51A, "no permission");
        validatorsPerOperatorLimit = _validatorsPerOperatorLimit;
    }

    function setValidatorsPerOperator(bytes calldata _operatorPublicKey, uint256 _validatorsPerOperator) external {
        // TODO: set real addresses
        require(msg.sender == 0x45E668aba4b7fc8761331EC3CE77584B7A99A51A, "no permission");
        validatorsPerOperator[_operatorPublicKey] = _validatorsPerOperator;
    }

    function validatorsPerOperatorCount(bytes calldata _operatorPublicKey) external view returns (uint256) {
        return validatorsPerOperator[_operatorPublicKey];
    }
}
