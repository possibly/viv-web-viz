/**
 * @packageDocumentation The JavaScript runtime for the Viv engine for emergent narrative in
 * games and simulations.
 */

/**
 * A definition for a Viv action.
 */
declare interface ActionDefinition {
    /**
     * Discriminator for the action construct type.
     */
    readonly type: ConstructDiscriminator.Action;
    /**
     * The (unique) name of the action.
     */
    readonly name: ActionName;
    /**
     * Whether this action is reserved, in which case it may only be targeted via selector targeting or queueing.
     */
    readonly reserved: boolean;
    /**
     * Mapping from the names of the roles associated with this action to their respective role definitions.
     *
     * The roles appear in the order in which the author defined them.
     */
    readonly roles: Record<RoleName, RoleDefinition>;
    /**
     * The name of the initiator role, isolated here for optimization purposes.
     */
    readonly initiator: RoleName;
    /**
     * The names of the roles constituting the roots of the trees composing role-dependency
     * forest for this action definition.
     *
     * The roots are given in the order by which role casting will proceed.
     */
    readonly roleForestRoots: RoleName[];
    /**
     * An expression yielding a numeric importance score the action.
     */
    readonly importance: IntField | FloatField | Enum;
    /**
     * Tags on the action.
     *
     * These are meant to facilitate search over actions, for story sifting, and their function
     * may be extended in the host application.
     */
    readonly tags: ListField;
    /**
     * Definition for a simple templated string describing this action in a sentence or so.
     */
    readonly gloss: StringField | TemplateStringField | null;
    /**
     * Definition for a more detailed templated string describing this action in a paragraph or so.
     */
    readonly report: StringField | TemplateStringField | null;
    /**
     * Conditions for the action, grouped by role name (with the special global-conditions key).
     *
     * A condition is an expression that must hold (i.e., evaluate to a truthy value) in order
     * for the action to be performed.
     */
    readonly conditions: ConstructConditions;
    /**
     * An ordered set of expressions that prepare a set of temporary variables that may be
     * referenced downstream in the action definition.
     *
     * These temporary variables can be referenced by an author using the `$` sigil, but this is
     * syntactic sugar for `@this.scratch` -- e.g., `$&foo` is equivalent to `@this.scratch.foo`,
     * with the second sigil indicating the type of the scratch variable.
     */
    readonly scratch: Expression[];
    /**
     * An ordered set of expressions that, when executed, cause updates to the host application state.
     */
    readonly effects: WrappedExpression[];
    /**
     * A set of expressions that each produce a reaction when evaluated.
     *
     * A reaction specifies an action that may be queued up for some time in the future,
     * should an instance of the one at hand be performed.
     */
    readonly reactions: WrappedExpression[];
    /**
     * Specifications for yielding numeric salience values for the action.
     *
     * The salience of an action is meant to serve as metadata on a character's knowledge of
     * the action -- it captures how noteworthy the action is to that character, and it can
     * e.g. fade over time to represent forgetting.
     */
    readonly saliences: Saliences;
    /**
     * Specifications for yielding subjective associations for the action.
     *
     * Like saliences, associations are meant to serve as metadata on a character's knowledge
     * of the action. In this case, it is a set of tags representing the character's subjective
     * view of the action.
     */
    readonly associations: Associations;
    /**
     * Embargo directives, which are authorial levers for controlling the frequency
     * with which an action will be performed in the host application.
     */
    readonly embargoes: EmbargoDeclaration[];
}

/**
 * A unique name for an action.
 *
 * @category Other
 */
export declare type ActionName = string;

/**
 * An array storing queued actions (and queued action selectors) for a character, in priority order.
 *
 * Urgent queued actions appear contiguously at the front of the array, followed by all non-urgent
 * queued actions. Within each bucket, entries are sorted by decreasing priority.
 *
 * @category Other
 */
export declare type ActionQueue = (QueuedAction | QueuedActionSelector)[];

/**
 * A Viv action relation, which evaluates to `true` if a specified
 * relation holds between two actions.
 */
declare interface ActionRelation extends SourceAnnotatedExpression, NegatableExpression {
    /**
     * Discriminator for a Viv action relation.
     */
    type: ExpressionDiscriminator.ActionRelation;
    /**
     * The actual expression value.
     */
    value: ActionRelationValue;
}

/**
 * Enum containing the action-relation operators supported by Viv.
 */
declare enum ActionRelationOperator {
    /**
     * Operator corresponding to general causation, where one action is a causal ancestor of another.
     */
    Caused = "caused",
    /**
     * Operator corresponding to temporal precedence, where one action occurred before another.
     */
    Preceded = "preceded",
    /**
     * Operator corresponding to direct causation, where one action is a causal ancestor of another.
     */
    Triggered = "triggered"
}

/**
 * The actual expression value for a Viv action relation.
 */
declare interface ActionRelationValue {
    /**
     * An expression whose evaluation will be used as the left operand in relation test.
     */
    readonly left: Expression;
    /**
     * The relation operator.
     */
    readonly operator: ActionRelationOperator;
    /**
     * An expression whose evaluation will be used as the right operand in relation test.
     */
    readonly right: Expression;
}

/**
 * A Viv action search.
 *
 * This kind of expression specifies the execution of a query to drive a search over either a character's
 * memories or the chronicle (all historical actions), to return a collection of actions matching the query.
 */
declare interface ActionSearch extends SourceAnnotatedExpression {
    /**
     * Discriminator for a Viv action search.
     */
    readonly type: ExpressionDiscriminator.ActionSearch;
    /**
     * The actual expression value.
     */
    readonly value: ActionSearchValue;
}

/**
 * The actual expression value for a Viv action search.
 */
declare interface ActionSearchValue {
    /**
     * The name of the query that will be used for the search, if any, else `null`.
     *
     * If none is provided, the search will simply retrieve all actions in the domain.
     */
    readonly queryName: QueryName | null;
    /**
     * Precast bindings for the target query, as asserted in the search declaration.
     */
    readonly bindings: PrecastBindings;
    /**
     * A declaration for how to construct a search domain for this action search.
     */
    readonly searchDomain: SearchDomainDeclaration;
}

/**
 * The definition for an action selector, which groups candidate actions (and potentially other action
 * selectors) under a targeting policy and succeeds upon successful targeting of one of the candidates.
 */
declare interface ActionSelectorDefinition extends SelectorDefinitionBase {
    /**
     * Discriminator for the action-selector construct type.
     */
    readonly type: ConstructDiscriminator.ActionSelector;
    /**
     * Whether this selector is reserved, in which case it may only be targeted
     * via selector targeting or queueing.
     */
    readonly reserved: boolean;
    /**
     * The name of the initiator role, isolated here for optimization purposes.
     */
    readonly initiator: RoleName;
}

/**
 * A structured event emitted during action targeting to provide real-time
 * observability into the action-selection process.
 *
 * These events are emitted via the optional {@link HostApplicationAdapterObservabilityCallbacks.onActionTargetingEvent}
 * callback on the adapter's debugging settings.
 *
 * @category Debugging
 */
export declare interface ActionTargetingEvent {
    /**
     * The targeting status associated with this event.
     */
    readonly status: TargetingEventStatus;
    /**
     * The impetus for this instance of action targeting.
     */
    readonly impetus: ActionTargetingEventImpetus;
    /**
     * The name of the action being targeted, as defined in the content bundle.
     */
    readonly action: ActionName;
    /**
     * The entity ID of the character for whom this action is being targeted.
     */
    readonly initiator: UID;
}

/**
 * Enum specifying the possible impetuses for a given instance of action targeting.
 *
 * @category Debugging
 */
export declare enum ActionTargetingEventImpetus {
    /**
     * The action was forcibly targeted via the {@link attemptAction} API.
     */
    Forced = "forced",
    /**
     * The action was targeted from the general pool of non-reserved actions.
     */
    General = "general",
    /**
     * The action was queued for the initiator (via a reaction).
     */
    Queued = "queued"
}

/**
 * A read-only entity view for an action that has been performed.
 *
 * For details on semantics and constraints, see {@link EntityView}, which this interface extends.
 *
 * @category Actions
 */
export declare interface ActionView extends EntityView {
    /**
     * Discriminator for the action entity type.
     */
    readonly entityType: EntityType.Action;
    /**
     * The name of the action being performed.
     */
    readonly name: ActionName;
    /**
     * A simple string (derived from an author-defined template) describing this action
     * in a sentence or so.
     *
     * This field is not `readonly` because it is set after an action is first recorded.
     */
    gloss: string | null;
    /**
     * A more detailed string (derived from an author-defined template) describing
     * this action in a paragraph or so.
     *
     * This field is not `readonly` because it is set after an action is first recorded.
     */
    report: string | null;
    /**
     * A numeric score capturing the importance of this action, for purposes of story sifting.
     */
    readonly importance: number;
    /**
     * Tags on the action. These are meant to facilitate search over actions, for story
     * sifting, and their function may be extended in the host application.
     *
     * This field is not `readonly` because it is set after an action is first recorded.
     */
    tags: string[];
    /**
     * The final bindings constructed for the action. Bindings map roles to the respective
     * entities (or symbols) that were cast in those roles.
     */
    readonly bindings: RoleBindings;
    /**
     * A blackboard storing arbitrary variables that a Viv author may set in the course of an action definition.
     *
     * These can be derived via expressions included in the action definition's `scratch` field, and variables
     * can also be set or mutated by assignments in the `effects` field (and also technically by side effects
     * from arbitrary custom function calls, which may be placed almost anywhere in an action definition). In
     * Viv parlance, *scratch variables* are set via the `$` notation, as in `$&foo = 77`, which is really just
     * syntactic sugar for `@this.scratch.foo == 77` -- i.e., syntactic sugar for setting a top-level property
     * in this object. This data persists in the action's entity data so that subsequent actions may refer to
     * it as needed, via expressions like `@past_action.scratch.baz`.
     */
    readonly scratch: Record<string, unknown>;
    /**
     * Entity ID for the storyworld location where this action was performed.
     */
    readonly location: UID;
    /**
     * The timestamp (in story time) at which this action occurred. Like all Viv timestamps, this is
     * represented as the number of minutes that have elapsed, in story time, since the running
     * simulation instance in the host application first commenced.
     */
    readonly timestamp: DiegeticTimestamp;
    /**
     * The time of day at which the action was performed. If the host application
     * does not model time of day, this will be `null`.
     */
    readonly timeOfDay: TimeOfDay | null;
    /**
     * Array containing entity IDs for all the actions that **directly** caused this one, if any. This data,
     * produced as the simulation proceeds through what I call *causal bookkeeping*, greatly facilitates
     * story sifting. The value here will always be deduplicated.
     */
    readonly causes: UID[];
    /**
     * Array containing entity IDs for all the actions **directly** caused by this one. The array will initially
     * be empty, but may be mutated later on by subsequent actions (always deduplicated).
     */
    readonly caused: UID[];
    /**
     * Array containing entity IDs for *all* causal ancestors of this one (always deduplicated).
     */
    readonly ancestors: UID[];
    /**
     * Array containing entity IDs for *all* causal descendants of this one (always deduplicated).
     */
    readonly descendants: UID[];
    /**
     * Array containing entity IDs for all actions about which this one relays knowledge. An action
     * is said to relay knowledge about another one when it casts it in one of its roles.
     */
    readonly relayedActions: UID[];
    /**
     * Entity ID for the initiator of this action. This field supports story sifting.
     */
    readonly initiator: UID;
    /**
     * Array containing entity IDs for the initiator and any entities cast in `partner`
     * roles (i.e., co-initiator roles) of this action. This field supports story sifting.
     */
    readonly partners: UID[];
    /**
     * Array containing entity IDs for any recipients of this action. This field supports story sifting.
     */
    readonly recipients: UID[];
    /**
     * Array containing entity IDs for any bystanders who witnessed, but did not
     * participate in, this action. This field supports story sifting.
     */
    readonly bystanders: UID[];
    /**
     * Array containing entity IDs for all characters who participated in this action, meaning all
     * present characters who were cast in non-`bystander` roles. This field supports story sifting.
     */
    readonly active: UID[];
    /**
     * Array containing entity IDs for all characters who participated in or otherwise directly witnessed
     * this action, meaning all active characters and also bystanders. This field supports story sifting.
     */
    readonly present: UID[];
}

/**
 * An active embargo that has been asserted in the running simulation instance of the host application.
 *
 * @category Other
 */
export declare interface ActiveEmbargo {
    /**
     * A unique identifier for the embargo, provisioned by Viv.
     */
    readonly id: string;
    /**
     * The name of the action associated with this embargo.
     */
    readonly actionName: ActionName;
    /**
     * If applicable, the entity ID for the location associated with this embargo.
     */
    readonly location: UID | null;
    /**
     * The timestamp at which the embargo will be lifted, otherwise `null` for a permanent embargo.
     */
    readonly expiration: DiegeticTimestamp | null;
    /**
     * A mapping from a role name to an array of entity IDs for entities who the embargo prohibits
     * from being cast in that role again (assuming the other embargo constraints hold). If the
     * embargo places no such constraints, this field will be set to `null`.
     */
    readonly bindings: RoleBindings | null;
}

/**
 * A Viv arithmetic expression, which accepts two numeric operands and evaluates to a number.
 */
declare interface ArithmeticExpression extends SourceAnnotatedExpression {
    /**
     * Discriminator for a Viv arithmetic expression.
     */
    readonly type: ExpressionDiscriminator.ArithmeticExpression;
    /**
     * The actual expression value.
     */
    readonly value: ArithmeticExpressionValue;
}

/**
 * The actual expression value for a Viv arithmetic expression.
 */
declare interface ArithmeticExpressionValue {
    /**
     * An expression whose evaluation will be used as the left operand in the arithmetic expression.
     */
    readonly left: Expression;
    /**
     * The arithmetic operator.
     */
    readonly operator: ArithmeticOperator;
    /**
     * An expression whose evaluation will be used as the right operand in the arithmetic expression.
     */
    readonly right: Expression;
}

/**
 * Enum containing the arithmetic operators supported by Viv.
 */
declare enum ArithmeticOperator {
    /**
     * The Viv addition operator.
     */
    Add = "+",
    /**
     * The Viv subtraction operator.
     */
    Subtract = "-",
    /**
     * The Viv multiplication operator.
     */
    Multiply = "*",
    /**
     * The Viv division operator.
     */
    Divide = "/"
}

/**
 * A Viv assignment (or update).
 */
declare interface Assignment extends SourceAnnotatedExpression {
    /**
     * Discriminator for a Viv assignment.
     */
    readonly type: ExpressionDiscriminator.Assignment;
    /**
     * The actual expression value.
     */
    readonly value: AssignmentValue;
}

/**
 * Enum containing the Viv assignment (and update) operators.
 */
declare enum AssignmentOperator {
    /**
     * Used to assign a value to the LHS of the assignment.
     */
    Assign = "=",
    /**
     * Used to increment the value of the LHS of the assignment.
     */
    AddAssign = "+=",
    /**
     * Used to decrement the value of the LHS of the assignment.
     */
    SubtractAssign = "-=",
    /**
     * Used to multiply the value of the LHS of the assignment.
     */
    MultiplyAssign = "*=",
    /**
     * Used to divide the value of the LHS of the assignment.
     */
    DivideAssign = "/=",
    /**
     * Used to append an element to the iterable value of the LHS of the assignment.
     */
    Append = "append",
    /**
     * Used to remove an element from the iterable value of the LHS of the assignment.
     */
    Remove = "remove"
}

/**
 * The actual expression value for a Viv assignment.
 */
declare interface AssignmentValue {
    /**
     * A reference specifying the target of the assignment/update.
     */
    readonly left: EntityReference | SymbolReference;
    /**
     * The assignment/update operator.
     */
    readonly operator: AssignmentOperator;
    /**
     * An expression whose evaluation will be used as the right operand in the assignment/update.
     *
     * Note that for assignments that update persistent entity data, the value will always be proactively
     * dehydrated, such that all entity data included in the value will be converted into the associated
     * entity ID. We do this to prevent several potential issues, and the data can be rehydrated later on.
     */
    readonly right: Expression;
}

/**
 * Specifications for determining the subjective associations for the action that will be held
 * by a given character who experiences, observes, or otherwise learns about the action.
 */
declare interface Associations {
    /**
     * A specification for a default value to be used as a fallback for any character for which there is no
     * applicable `roles` entry and for which no `custom` expression yielded a value.
     *
     * This will always be structured as a Viv list whose elements will be simple Viv string expressions.
     */
    readonly default: ListField;
    /**
     * A mapping from role names to Viv lists whose elements will be simple Viv string expressions.
     *
     * For a character who is bound in the given role, the corresponding expression will
     * determine their associations.
     */
    readonly roles: Record<RoleName, ListField>;
    /**
     * For characters for whom no `roles` entry applies, a series of zero or more custom
     * associations-yielding expressions will be evaluated, with the character bound to
     * the local variable specified in the `variable` property.
     *
     * These will be evaluated in turn, with the first evaluated string array being assigned as the character's
     * salience. If no custom expression evaluates to a numeric value, the default value will be used.
     *
     * This field is only used if there is no applicable per-role field for the character at hand.
     */
    readonly custom: Expression[];
    /**
     * If there is a non-empty `custom` field, the local variable to which a character will
     * be bound when computing associations for them.
     *
     * This allows for evaluation of the body expressions, which may refer to this variable
     * in order to do things like conditionalize associations based on the character at hand.
     */
    readonly variable: LocalVariable | null;
}

/**
 * A helper type for adapter functions, allowing them to be either asynchronous or synchronous.
 *
 * @category Other
 */
export declare type AsyncOrSync<T> = T | Promise<T>;

/**
 * Invokes the Viv action manager to force targeting of the specific given action.
 *
 * This function can be useful for debugging, and it can also support designs where a host application
 * takes a more direct role in action selection. For instance, a host application might implement a
 * lightweight drama manager that occasionally intervenes to force targeting of a particular action that
 * is narratively desirable at some point. As another example, an application might incorporate player
 * activity into the Viv action system by representing the player as a character who is cast as initiator
 * in actions that are defined in the content bundle. In the latter situation, non-player characters (NPCs)
 * would "understand" those actions for free, leading to believable reactions and, ultimately, emergent
 * storylines that weave together player and NPC activities.
 *
 * @category Actions
 * @example
 * ```ts
 * const actionID = await attemptAction({
 *     actionName: "give-gift",
 *     initiatorID: "cid-alice",
 *     precastBindings: { "giver": ["cid-alice"], "receiver": ["cid-bob"], "gift": ["chocolate"] },
 *     causes: ["aid-97", "aid-1732"],
 *     suppressConditions: true
 * });
 * if (actionID === null) {
 *     console.log("No action performed");
 * }
 * ```
 * @param args - See {@link AttemptActionArgs}.
 * @returns - See {@link AttemptActionResult}.
 * @throws {@link VivNotInitializedError} If Viv has not been initialized.
     * @throws {@link VivInterpreterError} If the Viv interpreter encounters an issue in the course of action selection.
         * @throws {@link VivValidationError} If the supplied `args` do not conform to the expected schema.
             * @throws {@link VivValidationError} If there is no defined action with the given `actionName`.
                 * @throws {@link VivValidationError} If `initiatorID` is provided, but is not an entity ID for a character.
                     * @throws {@link VivValidationError} If both `initiatorID` and `precastBindings` are provided, but `initiatorID`
                         *     does not appear in `precastBindings` under the initiator role.
                         * @throws {@link VivValidationError} If `precastBindings` is provided, and the precast bindings fail validation.
                             * @throws {@link VivValidationError} If `causes` is provided, but contains something
                                 *     other than an entity ID for an action.
                                 */
                             export declare function attemptAction(args: AttemptActionArgs): Promise<AttemptActionResult>;

                             /**
                              * Arguments parameterizing a request to force a specific action to be attempted and/or performed.
                              *
                              * @category Other
                              * @remarks These are the effective arguments to {@link attemptAction}.
                              */
                             export declare interface AttemptActionArgs {
                                 /**
                                  * The name of the action to attempt.
                                  */
                                 readonly actionName: ActionName;
                                 /**
                                  * Entity ID for the character who will attempt the action.
                                  *
                                  * If elided, characters will be shuffled, and each will attempt the action in turn. If this
                                  * field is set, the same entity ID must appear in the initial role in `precastBindings`.
                                  *
                                  * Note: The runtime will confirm that this is an entity ID for a character.
                                  */
                                 readonly initiatorID?: UID;
                                 /**
                                  * Partial or complete role bindings to use when targeting the action.
                                  *
                                  * If both `initiatorID` and this field are present, `initiatorID` must be bound to the initiator role
                                  * here. If there are any required role slots that have not been precast here, the role caster will
                                  * attempt to fill them, and targeting will fail if they cannot be filled (though see `suppressConditions`).
                                  * Likewise, the role caster will also attempt to fill any unfilled optional role slots.
                                  */
                                 readonly precastBindings?: RoleBindings;
                                 /**
                                  * An array containing entity IDs for arbitrary actions that the host application
                                  * has indicated as causes of the action about to be performed.
                                  *
                                  * This parameter supports a design pattern in which a host application captures player activity Viv
                                  * actions. In such a design, the host application might reason about the causes of player activity,
                                  * to identify which NPC actions led to the behaviors that are being represented as simulation actions
                                  * via the call here.
                                  *
                                  * It can also support a design pattern where something like a drama manager decides that it would be
                                  * desirable if an action that did not occur actually had occurred -- for instance, a character affronted
                                  * another one, who could have concocted a revenge scheme that fits nicely in a larger central narrative,
                                  * but they did not happen to queue `plot-revenge` as a reaction. The drama manager could intervene by
                                  * effectively forcing `plot-revenge` with the original affronting action as its cause, which means story
                                  * sifting could work per usual over the causal line.
                                  *
                                  * Note: The runtime will confirm that each entry here is in fact the entity ID for some action,
                                  * and it will also deduplicate the given causes automatically.
                                  */
                                 readonly causes?: UID[];
                                 /**
                                  * A flag specifying that the action conditions should be ignored when targeting the action.
                                  *
                                  * In such cases, the action can effectively be forced to occur, so long as the role caster is able to find
                                  * enough entities to fill each required role slot. For instance, if `precastBindings` does not cover all
                                  * required role slots, and if a given role with an open slot requires nearby characters, and if there are
                                  * not enough characters near the initiator, then targeting could fail even though this flag was set here.
                                  * In other words, the flag doesn't force an action to occur, but rather prevents condition failure from
                                  * thwarting actions for which casts could otherwise be assembled.
                                  *
                                  * Note that the flag only suppresses the `conditions` field of the action at hand. Any implied conditions
                                  * in concerns like casting-pool declarations will still be honored.
                                  *
                                  * This field should always be `true` when present.
                                  *
                                  * @defaultValue false
                                  */
                                 readonly suppressConditions?: true;
                             }

                             /**
                              * If the attempted action was successfully performed, its entity ID, else `null`.
                              *
                              * @category Other
                              * @remarks This is the return value for {@link attemptAction}.
                              */
                             export declare type AttemptActionResult = UID | null;

                             /**
                              * A mapping from a reason for backtracking to a count indicating the number of times
                              * that reason applied during the debugging window.
                              *
                              * @category Other
                              */
                             export declare type BacktrackingReasonCounts = {
                                 [K in RoleCastingBacktrackReason]?: number;
                             };

                             /**
                              * A Viv boolean.
                              */
                             declare interface BoolField extends SourceAnnotatedExpression {
                                 /**
                                  * Discriminator for a Viv boolean.
                                  */
                                 readonly type: ExpressionDiscriminator.Bool;
                                 /**
                                  * The boolean literal to which this expression will evaluate.
                                  */
                                 readonly value: boolean;
                             }

                             /**
                              * A directive specifying the pool of entities who may be cast into a role at a given point in time,
                              * given an initiator and possibly other prospective role bindings.
                              */
                             declare interface CastingPool {
                                 /**
                                  * The Viv expression that should evaluate to a casting pool.
                                  */
                                 readonly body: Expression;
                                 /**
                                  * Whether the casting pool is cachable.
                                  *
                                  * A casting pool is cachable so long as the associated pool declaration *does not* reference
                                  * a non-initiator role, in which case the role pool would have to be re-computed if the parent
                                  * role(s) are re-cast (which never happens with an initiator role). When a casting pool is cached,
                                  * it is not recomputed even as other non-initiator roles are re-cast.
                                  */
                                 readonly uncachable: boolean;
                             }

                             /**
                              * A Viv chance expression, which is a kind of condition that evaluates to true if the specified probability
                              * value (a number between 0.0 and 1.0) exceeds a pseudorandom number generated by the interpreter.
                              */
                             declare interface ChanceExpression extends SourceAnnotatedExpression {
                                 /**
                                  * Discriminator for a Viv chance expression.
                                  */
                                 readonly type: ExpressionDiscriminator.ChanceExpression;
                                 /**
                                  * The specified probability, which the compiler guarantees to be a number in the range `[0, 1]`.
                                  */
                                 readonly value: number;
                             }

                             /**
                              * A mapping from action entity IDs to memories of those actions.
                              *
                              * @category Other
                              */
                             export declare type CharacterMemories = Record<UID, CharacterMemory>;

                             /**
                              * A character's (subjective) knowledge of an action that has occurred in a
                              * simulated storyworld, including metadata like salience and associations.
                              *
                              * @category Knowledge
                              */
                             export declare interface CharacterMemory {
                                 /**
                                  * Entity ID for the action that is the subject of this memory.
                                  */
                                 readonly action: UID;
                                 /**
                                  * The story-time timestamp when the memory was first formed.
                                  */
                                 readonly formationTimestamp: DiegeticTimestamp;
                                 /**
                                  * A numeric value capturing how noteworthy the action is to the character who holds this memory.
                                  *
                                  * This is also operationalized as the *strength* of the memory, with forgetting being modeled
                                  * by reducing this increment over time.
                                  */
                                 salience: number;
                                 /**
                                  * A set of tags representing subjective associations held by the character at hand with
                                  * regard to the action that is the subject of this memory.
                                  *
                                  * This is always deduplicated.
                                  */
                                 associations: string[];
                                 /**
                                  * An array containing entity IDs for all the actions that have led to this person learning or
                                  * hearing about this action.
                                  *
                                  * For direct observers of the action, the value will begin as a singleton array containing the
                                  * action itself. For characters who learn about it secondhand, via another action or an item
                                  * inspection, the array will initially contain only the action that relayed this knowledge.
                                  *
                                  * In any event, over time the array may grow as a character recalls or imparts the action,
                                  * or hears about it again later on from other characters.
                                  */
                                 readonly sources: UID[];
                                 /**
                                  * Whether the memory has been forgotten.
                                  *
                                  * A memory is forgotten when its salience falls below the {@link HostApplicationAdapterConfig.memoryForgettingSalienceThreshold}.
                                  */
                                 forgotten: boolean;
                             }

                             /**
                              * A read-only entity view for a character in a simulated storyworld.
                              *
                              * For details on semantics and constraints, see {@link EntityView}, which this interface extends.
                              *
                              * @category Integration
                              */
                             export declare interface CharacterView extends EntityView {
                                 /**
                                  * Discriminator specifying the character entity type.
                                  */
                                 readonly entityType: EntityType.Character;
                                 /**
                                  * The entity ID for the current location of the character.
                                  *
                                  * Viv assumes that each character is in a discrete location at any given point, and that the
                                  * location is itself an entity for which a {@link LocationView} may be requested.
                                  */
                                 readonly location: UID;
                                 /**
                                  * The character's memories for all the actions they know about.
                                  */
                                 readonly memories: CharacterMemories;
                             }

                             /**
                              * Enum containing the Viv comparison operators.
                              */
                             declare enum Comparator {
                                 /**
                                  * Used to test whether two operands are equal.
                                  */
                                 Equals = "==",
                                 /**
                                  * Used to test whether the left operand is greater than the right operand.
                                  */
                                 GreaterThan = ">",
                                 /**
                                  * Used to test whether the left operand is greater than or equal to the right operand.
                                  */
                                 GreaterThanOrEqual = ">=",
                                 /**
                                  * Used to test whether the left operand is less than the right operand.
                                  */
                                 LessThan = "<",
                                 /**
                                  * Used to test whether the left operand is less than or equal to the right operand.
                                  */
                                 LessThanOrEqual = "<=",
                                 /**
                                  * Used to test whether two operands are not equal.
                                  */
                                 NotEquals = "!="
                             }

                             /**
                              * A Viv comparison, whereby two values are compared using a comparator.
                              */
                             declare interface Comparison extends SourceAnnotatedExpression, NegatableExpression {
                                 /**
                                  * Discriminator for a Viv comparison.
                                  */
                                 readonly type: ExpressionDiscriminator.Comparison;
                                 /**
                                  * The actual expression value.
                                  */
                                 readonly value: ComparisonValue;
                             }

                             /**
                              * The actual expression value for a Viv comparison.
                              */
                             declare interface ComparisonValue {
                                 /**
                                  * An expression whose evaluation will serve as the left operand in the comparison.
                                  */
                                 readonly left: Expression;
                                 /**
                                  * The comparison operator.
                                  */
                                 readonly operator: Comparator;
                                 /**
                                  * An expression whose evaluation will serve as the right operand in the comparison.
                                  */
                                 readonly right: Expression;
                             }

                             /**
                              * A Viv conditional expression, allowing for branching based on the value of a test.
                              */
                             declare interface Conditional extends SourceAnnotatedExpression {
                                 /**
                                  * Discriminator for a Viv conditional.
                                  */
                                 readonly type: ExpressionDiscriminator.Conditional;
                                 /**
                                  * The actual expression value.
                                  */
                                 readonly value: ConditionalValue;
                             }

                             /**
                              * A Viv conditional branch, representing an `if` or `elif` clause.
                              */
                             declare interface ConditionalBranch {
                                 /**
                                  * The condition that will be tested, which holds if its evaluation is truthy.
                                  */
                                 readonly condition: Expression;
                                 /**
                                  * An array of expressions that will be evaluated/executed should the condition hold.
                                  */
                                 readonly consequent: Expression[];
                             }

                             /**
                              * The actual expression value for a Viv conditional.
                              */
                             declare interface ConditionalValue {
                                 /**
                                  * Branches representing the `if` and `elif` clauses in this conditional expression.
                                  */
                                 readonly branches: ConditionalBranch[];
                                 /**
                                  * If an author has provided an alternative body (via an `else` clause), an array
                                  * of expressions that will be evaluated/executed should the condition *not* hold.
                                  */
                                 readonly alternative: Expression[] | null;
                             }

                             /**
                              * An object recording for a given condition its number of successes
                              * and failures (across tests of the condition).
                              *
                              * @category Other
                              */
                             export declare interface ConditionResultCounts {
                                 /**
                                  * The original source code for this condition.
                                  */
                                 condition: string;
                                 /**
                                  * The number of times this condition succeeded.
                                  */
                                 successes: number;
                                 /**
                                  * The number of times this condition failed.
                                  */
                                 failures: number;
                             }

                             /**
                              * A Viv conjunction, which takes multiple expressions and evaluates to `true` if and
                              * only if all the respective expressions evaluate to JavaScript-truthy values.
                              */
                             declare interface Conjunction extends SourceAnnotatedExpression, NegatableExpression {
                                 /**
                                  * Discriminator for a Viv conjunction.
                                  */
                                 readonly type: ExpressionDiscriminator.Conjunction;
                                 /**
                                  * The actual expression value.
                                  */
                                 readonly value: ConjunctionValue;
                             }

                             /**
                              * The actual expression value for a Viv conjunction.
                              */
                             declare interface ConjunctionValue {
                                 /**
                                  * An array of expressions that will be evaluated in turn to determine the result of the conjunction.
                                  *
                                  * Note that the interpreter stops evaluating as soon as a falsy (in JavaScript) evaluation is encountered.
                                  */
                                 readonly operands: Expression[];
                             }

                             /**
                              * Conditions that must hold in order to target a given construct.
                              */
                             declare interface ConstructConditions {
                                 /**
                                  * Global construct conditions, meaning ones that do not reference any roles
                                  * and can thus be tested immediately upon targeting a construct.
                                  */
                                 readonly globalConditions: WrappedExpression[];
                                 /**
                                  * Standard conditions, keyed by the role during whose casting they will be tested.
                                  */
                                 readonly roleConditions: Record<RoleName, WrappedExpression[]>;
                             }

                             /**
                              * A Viv construct definition.
                              */
                             declare type ConstructDefinition = ActionDefinition | ActionSelectorDefinition | QueryDefinition | PlanDefinition | PlanSelectorDefinition | SiftingPatternDefinition | TropeDefinition;

                             /**
                              * Enum specifying the discriminators for all Viv construct types.
                              */
                             declare enum ConstructDiscriminator {
                                 /**
                                  * Discriminator for action definitions.
                                  */
                                 Action = "action",
                                 /**
                                  * Discriminator for action-selector definitions.
                                  */
                                 ActionSelector = "actionSelector",
                                 /**
                                  * Discriminator for plan definitions.
                                  */
                                 Plan = "plan",
                                 /**
                                  * Discriminator for plan-selector definitions.
                                  */
                                 PlanSelector = "planSelector",
                                 /**
                                  * Discriminator for query definitions.
                                  */
                                 Query = "query",
                                 /**
                                  * Discriminator for sifting-pattern definitions.
                                  */
                                 SiftingPattern = "siftingPattern",
                                 /**
                                  * Discriminator for trope definitions.
                                  */
                                 Trope = "trope"
                             }

                             /**
                              * A Viv construct name.
                              */
                             declare type ConstructName = ActionName | PlanName | QueryName | SelectorName | SiftingPatternName | TropeName;

                             /**
                              * Returns a *sifting-match diagram* that visualizes a match for a sifting pattern.
                              *
                              * The diagram constructed here is a causal tree diagram similar to what {@link constructTreeDiagram} returns,
                              * except in this case all the actions matched by the sifting pattern will be named nodes, whereas in a
                              * {@link constructTreeDiagram} only a single anchor action is named. Moreover, the diagram will include
                              * all ancestors, descendants, and collateral relatives for *each* of the actions matched by the pattern. As
                              * a result, sifting-match diagrams cover more ground, and thus by default make heavy use of elision, where
                              * entire subtrees are collapsed using *elision indicators* of the form `⋮ (N)`.
                              *
                              * The position of each elision indicator tells you what has been collapsed:
                              *
                              * - Above a root: `N` ancestors of the root.
                              * - Between two matched actions: `N` intermediate actions on the direct causal path between them.
                              * - Sibling of a matched action: a sibling and its `N-1` descendants.
                              * - Below a leaf: `N` descendants of the leaf.
                              *
                              * When a matched action has causal ancestors arriving via a separate lineage (from the one
                              * marked by the edge from its parent), a *convergence indicator* appears above it:
                              *
                              * - `[⋯shortID] ⋮ (N)`: `N` ancestors arrive from the lineage of a named ancestor visible
                              *   elsewhere in the diagram.
                              * - `─┼ ⋮ (N)`: `N` ancestors arrive from a lineage with no named ancestor in the diagram.
                              *
                              * Matched actions are labeled with their sifting-pattern role in parentheses, e.g.,
                              * `vow-revenge (turning-point) [a7]`. In ANSI mode, each role gets a distinct color
                              * from a cycling palette.
                              *
                              * Finally, as in {@link constructTreeDiagram}, the diagram is technically a *directed acyclic graph*
                              * (DAG), may be presented with multiple distinct subtrees, and may make use of back references.
                              *
                              * @category Analysis
                              * @example
                              * ```ts
                              * const siftingMatch = await runSiftingPattern({ patternName: "mutiny" });
                              * if (match) {
                              *     const diagram = await constructSiftingMatchDiagram({ siftingMatch, ansi: true });
                              *     console.log(diagram);
                              * }
                              * ```
                              * @example
                              * ```
                              * ⋮ (31)
                              * └─ insult-crew-member (buildup) [a1]
                              *    ⋮ (4)
                              *    └─ recruit-conspirators (buildup) [a2]
                              *       ⋮ (3)
                              * [⋯a1] ⋮ (7)
                              *    ─┼ ⋮ (14)
                              *       └─ attempt-mutiny (mutiny) [a3]
                              *          └─ captain-defeats-mutiny (mutiny) [a4]
                              *             └─ maroon-on-island (aftermath) [a5]
                              *                ⋮ (74)
                              *                └─ signal-passing-ship (aftermath) [a6]
                              *                   └─ board-ship (aftermath) [a7]
                              *                      ⋮ (512)
                              *
                              * ⋮ (8)
                              * └─ cut-crew-rations (buildup) [b1]
                              *    ⋮ (2)
                              *    └─ recruit-conspirators [=a2]
                              *
                              * ┌──────────────────────┐
                              * │ a1 : aid-f8a3b2c7    │
                              * │ a2 : aid-2d4e6f8a    │
                              * │ a3 : aid-k1l2m3n4    │
                              * │ a4 : aid-u1v2w3x4    │
                              * │ a5 : aid-e1f2a3b4    │
                              * │ a6 : aid-4b6c8d0e    │
                              * │ a7 : aid-l4m5n6o7    │
                              * │ b1 : aid-m9n0o1p2    │
                              * └──────────────────────┘
                              * ```
                              * @param args - See {@link ConstructSiftingMatchDiagramArgs}.
                              * @returns See {@link ConstructSiftingMatchDiagramResult}.
                              * @throws {@link VivNotInitializedError} If Viv has not been initialized.
                                  * @throws {@link VivValidationError} If the sifting match is empty or contains invalid action IDs.
                                      */
                                  export declare function constructSiftingMatchDiagram(args: ConstructSiftingMatchDiagramArgs): Promise<ConstructSiftingMatchDiagramResult>;

                                  /**
                                   * Arguments parameterizing a request to construct a sifting-match diagram.
                                   *
                                   * @category Analysis
                                   * @remarks These are the effective arguments to {@link constructSiftingMatchDiagram}.
                                   */
                                  export declare interface ConstructSiftingMatchDiagramArgs {
                                      /**
                                       * The sifting match to visualize, as returned by {@link runSiftingPattern}.
                                       */
                                      readonly siftingMatch: SiftingMatch;
                                      /**
                                       * An optional callback that renders the label for each node in the diagram.
                                       *
                                       * The callback receives the action's entity ID, and should return a string
                                       * to use as the node label. If omitted, the action name is used as the label.
                                       *
                                       * The callback must be synchronous.
                                       */
                                      readonly formatLabel?: (actionID: UID) => string;
                                      /**
                                       * Whether to include ANSI escape codes for terminal highlighting.
                                       *
                                       * When enabled, matched actions are styled in role-specific colors and glue
                                       * actions are dimmed.
                                       *
                                       * @defaultValue false
                                       */
                                      readonly ansi?: boolean;
                                      /**
                                       * Maximum number of children to render per node.
                                       *
                                       * If omitted, all children are rendered.
                                       *
                                       * @defaultValue Infinity
                                       */
                                      readonly maxChildren?: number;
                                      /**
                                       * Whether to elide unmatched actions from the diagram.
                                       *
                                       * When enabled (by default), only the actions matched by the sifting pattern are rendered as named
                                       * nodes in the tree diagram -- all other actions will be marked by *elision indicators*, as described
                                       * in {@link constructSiftingMatchDiagram}.
                                       *
                                       * When disabled, the full causal spanning tree connecting all matched actions is rendered, with every
                                       * intermediate (glue) action visible.
                                       *
                                       * **Warning:** In large simulations, a spanning tree may contain many thousands of actions,
                                       * so take care before setting this to `false`.
                                       *
                                       * @defaultValue true
                                       */
                                      readonly elide?: boolean;
                                  }

                                  /**
                                   * A string containing a sifting-match diagram rendered in a human-readable text format.
                                   *
                                   * @category Analysis
                                   * @remarks This is the return value for {@link constructSiftingMatchDiagram}.
                                   */
                                  export declare type ConstructSiftingMatchDiagramResult = string;

                                  /**
                                   * Returns a *causal tree diagram* that is anchored in a given action, displaying the entire
                                   * causal structure rooted in the action's causal primogenitor(s).
                                   *
                                   * This diagram will include every action that is causally related to the given one, either as an ancestor,
                                   * a descendant, or a collateral relative. Rather than a tree, the diagram will technically be structured
                                   * as a *directed acyclic graph* (DAG), the roots of which are all the actions that are causally related
                                   * to the given one and have no direct causes. The leaves will be actions that caused no other actions.
                                   * Multiple roots obtain when the anchor (or an ancestor) is directly caused by actions from two or more
                                   * lineages that do not share a common ancestor.
                                   *
                                   * As a concrete example, imagine a story about a prison escape, where two inmates scheme together to devise
                                   * a clever escape plan, which succeeds. In a Viv-powered simulation, the two inmates might have each been
                                   * sent to prison as a result of distinct complex emergent storylines that are themselves causal trees.
                                   *
                                   * When the characters decide to scheme together, that action could have *both* of the backstory trees as
                                   * causal lineages, meaning the two trees converged into one node. And as the escape plays out, with its
                                   * own upshot and ramifications, those downstream emergent storylines would themselves be trees that are
                                   * components of the larger one at play here. So multiple trees converge on one node, and that node then
                                   * spawns multiple distinct trees downstream from it.
                                   *
                                   * In any reasonably complex Viv project, and particularly ones that make proper use of reactions, these
                                   * trees can resemble a hyper-Pynchonian gnarl that challenges human interpretation -- but the tree will
                                   * be made of smaller trees that correspond more directly to conventional storylines.
                                   *
                                   * In the tree diagram, each node is identified in a compact notation combining a family-letter prefix
                                   * with a numeric identifier. The family-letter prefix corresponds to one of the root actions in the
                                   * tree (DAG). While an action node can of course have multiple root ancestors, it will be associated
                                   * with the one in whose subtree it first appears. Later references to the same action will reuse
                                   * that same identifier, in a *back reference* (see below).
                                   *
                                   * Here's a breakdown on the notation used in the diagrams:
                                   *   - Box-drawing characters mark the contours of the tree structure.
                                   *   - Each action is given a compact identifier of the form `<family-letter><number>`.
                                   *   - The anchor action is marked with a special character (defaults to `*`).
                                   *   - Linear chains (terminal sequences of single-child actions) are collapsed into `→`-separated runs.
                                   *   - Back references of the form `[=identifier]` are used for actions that have already appeared in
                                   *     the diagram, above where the back reference is used.
                                   *   - A legend below the diagram maps each compact identifier to the actual action {@link UID}.
                                   *
                                   * @category Analysis
                                   * @example
                                   * ```ts
                                   * const diagram = await constructTreeDiagram({ actionID: "aid-1234", ansi: true });
                                   * console.log(diagram);
                                   * ```
                                   * @example
                                   * ```
                                   * commit-robbery [a1]
                                   * └─ get-sentenced [a2]
                                   *    └─ meet-in-yard [a3]
                                   *       └─ * scheme-together [a4]
                                   *          └─ attempt-escape [a5]
                                   *             ├─ flee-country [a6] → cross-border [a7] → reach-safehouse [a8]
                                   *             └─ launch-manhunt [a9] → set-up-roadblocks [a10]
                                   *
                                   * commit-fraud [b1]
                                   * └─ get-sentenced [b2]
                                   *    └─ meet-in-yard [=a3]
                                   *
                                   * ┌────────────────────────┐
                                   * │ a1  : aid-9f2a3b7c     │
                                   * │ a2  : aid-4d8e1f3a     │
                                   * │ a3  : aid-7b2c9d4e     │
                                   * │ *a4 : aid-1234         │
                                   * │ a5  : aid-6c3d7a9b     │
                                   * │ a6  : aid-8e4f2a1c     │
                                   * │ a7  : aid-3b9d6e5f     │
                                   * │ a8  : aid-5a1c8d2e     │
                                   * │ a9  : aid-2f7b4a3d     │
                                   * │ a10 : aid-9d3e6f1a     │
                                   * │ b1  : aid-4a8b2c7d     │
                                   * │ b2  : aid-7f1d5e9a     │
                                   * └────────────────────────┘
                                   * ```
                                   * @param args - See {@link ConstructTreeDiagramArgs}.
                                   * @returns See {@link ConstructTreeDiagramResult}.
                                   * @throws {@link VivNotInitializedError} If Viv has not been initialized.
                                       * @throws {@link VivValidationError} If `actionID` is not a valid entity ID for an action.
                                           */
                                       export declare function constructTreeDiagram(args: ConstructTreeDiagramArgs): Promise<ConstructTreeDiagramResult>;

                                       /**
                                        * Arguments parameterizing a request to construct a causal tree diagram.
                                        *
                                        * @category Analysis
                                        * @remarks These are the effective arguments to {@link constructTreeDiagram}.
                                        */
                                       export declare interface ConstructTreeDiagramArgs {
                                           /**
                                            * Entity ID for the anchor action.
                                            *
                                            * The diagram will render the complete causal tree containing this action,
                                            * and the anchor will be highlighted with `anchorMarker` (or a default).
                                            */
                                           readonly actionID: UID;
                                           /**
                                            * An optional callback that renders the label for each node in the diagram.
                                            *
                                            * The callback receives the action's entity ID, and should return a string to use
                                            * as the node label. If omitted, the action name will be used as the label.
                                            *
                                            * The callback must be synchronous.
                                            *
                                            * @param actionID - The entity ID for the action to produce a label for.
                                            * @returns A label for a tree node for the given action.
                                            */
                                           readonly formatLabel?: (actionID: UID) => string;
                                           /**
                                            * The string used to mark the anchor action in the diagram.
                                            *
                                            * If the default collides with text produced by the `formatLabel` callback, a more distinctive
                                            * marker can be supplied here. Otherwise, the default value here will not appear elsewhere in
                                            * the diagram (making it easy to search for the anchor action).
                                            *
                                            * @defaultValue "*"
                                            */
                                           readonly anchorMarker?: string;
                                           /**
                                            * Whether to include ANSI escape codes for stylized text display in terminal settings.
                                            *
                                            * When enabled, certain elements will be displayed in color and/or with other style.
                                            *
                                            * @defaultValue false
                                            */
                                           readonly ansi?: boolean;
                                           /**
                                            * The maximum number of children to render per node.
                                            *
                                            * When a node has more children than this limit, the excess members are replaced with an
                                            * indicator showing the number of hidden siblings among the node's children.
                                            *
                                            * If omitted, all children are rendered.
                                            *
                                            * @defaultValue Infinity
                                            */
                                           readonly maxChildren?: number;
                                       }

                                       /**
                                        * A string containing a causal tree diagram rendered in a human-readable text format.
                                        *
                                        * If requested, the string will contain ANSI escape codes (for color and other style).
                                        *
                                        * @category Analysis
                                        * @remarks This is the return value for {@link constructTreeDiagram}.
                                        */
                                       export declare type ConstructTreeDiagramResult = string;

                                       /**
                                        * An arbitrary function exposed by the host application in its Viv adapter, which authors
                                        * can reference using the `~` sigil, as in e.g. `~transport(@person.id, @destination.id)`.
                                        *
                                        * @category Integration
                                        */
                                       export declare type CustomFunction = (...args: ExpressionValue[]) => AsyncOrSync<ExpressionValue>;

                                       /**
                                        * A Viv custom-function call, which parameterizes a call to a custom function that
                                        * is registered in the host application's Viv adapter.
                                        *
                                        * For instance, a Viv author might specify a function call in an action such as
                                        * `~transport(@person.id, @destination.id)`, in which case there must be a function
                                        * `transport()` exposed in the adapter.
                                        *
                                        * The Viv runtime confirms the existence of all referenced function names during adapter initialization.
                                        */
                                       declare interface CustomFunctionCall extends SourceAnnotatedExpression, NegatableExpression {
                                           /**
                                            * Discriminator for a Viv custom-function call.
                                            */
                                           readonly type: ExpressionDiscriminator.CustomFunctionCall;
                                           /**
                                            * The actual expression value.
                                            */
                                           readonly value: CustomFunctionCallValue;
                                       }

                                       /**
                                        * The actual expression value for a Viv custom-function call.
                                        */
                                       declare interface CustomFunctionCallValue extends FailSafeComponent {
                                           /**
                                            * The name of the custom function.
                                            *
                                            * There must be a function stored in the host application's Viv adapter, via a key by this same name.
                                            */
                                           readonly name: CustomFunctionName;
                                           /**
                                            * An ordered array of Viv expressions whose evaluations will be passed as arguments
                                            * to the function, in that same order.
                                            */
                                           readonly args: Expression[];
                                       }

                                       /**
                                        * The name for a custom function exposed by the host application in its Viv adapter.
                                        *
                                        * @category Other
                                        */
                                       export declare type CustomFunctionName = string;

                                       /**
                                        * The number of minutes that have elapsed, in story time, since some initial reference point
                                        * in the running simulation instance of the host application.
                                        *
                                        * Note that you can actually define whatever starting point you'd like, so long as the
                                        * time unit is minutes and timestamps increase monotonically as a simulation proceeds.
                                        *
                                        * Every host application must be capable of representing a given point in
                                        * story time as a simple numeric timestamp, in the manner of Unix epoch time.
                                        *
                                        * @category Other
                                        */
                                       export declare type DiegeticTimestamp = number;

                                       /**
                                        * A Viv disjunction, which takes multiple expressions and evaluates to `true` if and only
                                        * if at least one of the respective expressions evaluate to a JavaScript-truthy value.
                                        */
                                       declare interface Disjunction extends SourceAnnotatedExpression, NegatableExpression {
                                           /**
                                            * Discriminator for a Viv disjunction.
                                            */
                                           readonly type: ExpressionDiscriminator.Disjunction;
                                           /**
                                            * The actual expression value.
                                            */
                                           readonly value: DisjunctionValue;
                                       }

                                       /**
                                        * The actual expression value for a Viv disjunction.
                                        */
                                       declare interface DisjunctionValue {
                                           /**
                                            * An array of expressions that will be evaluated in turn to determine the result of the disjunction.
                                            *
                                            * Note that the interpreter stops evaluating as soon as a truthy (in JavaScript) evaluation is encountered.
                                            */
                                           readonly operands: Expression[];
                                       }

                                       /**
                                        * An embargo declaration constraining the subsequent performance of an associated action.
                                        */
                                       declare interface EmbargoDeclaration {
                                           /**
                                            * If applicable, names for all the roles constituting the bindings over which this embargo holds.
                                            *
                                            * For instance, if two roles R1 and R2 were specified here, and if an action A was performed with
                                            * bindings R1=[E1] and R2=[E2, E3], then this embargo would hold over all cases of A with any
                                            * prospective bindings that cast E1 in R1 and *either* E2 and/or E3 in R2. Stated differently, the
                                            * embargo holds if for all roles specified here, some subset overlaps between the embargo role
                                            * bindings and the prospective role bindings. Often, an embargo will only specify an initiator.
                                            */
                                           readonly roles: RoleName[] | null;
                                           /**
                                            * Whether the embargo is permanent.
                                            *
                                            * If so, `period` will always be `null`, and exactly one of the fields is guaranteed to be truthy.
                                            */
                                           readonly permanent: boolean;
                                           /**
                                            * For an embargo that is not permanent, a specification of the time period over which
                                            * the embargo will hold.
                                            *
                                            * If `period` is present, `permanent` will always be false, and exactly one of the fields
                                            * is guaranteed to be truthy.
                                            */
                                           readonly period: TimeDelta | null;
                                           /**
                                            * Whether the embargo holds only over a certain location, that being the location
                                            * at which an instance of the associated action has just been performed.
                                            */
                                           readonly here: boolean;
                                       }

                                       /**
                                        * A Viv entity reference, structured as an anchor role and a (possibly empty) path to a specific property value.
                                        *
                                        * Usually, the property is on the entity cast into the anchor role, but this is not the case if the reference
                                        * contains a pointer. For instance, `@person.boss->boss->traits.cruel` would return the value stored at the path
                                        * `traits.cruel` on the boss of the boss of the entity cast in the anchor role `@person`. Note that the compiler
                                        * currently prevents an author from anchoring an entity reference in a symbol role, which allows the interpreter
                                        * to assume that the anchor role binds an entity. Also note that references anchored in scratch variables, e.g.
                                        * `$@foo.bar.baz`, are compiled to entity references -- this is because `$` is really just syntactic sugar for
                                        * `@this.scratch.`, with the next sigil indicating the type of the scratch variable.
                                        */
                                       declare interface EntityReference extends SourceAnnotatedExpression, NegatableExpression {
                                           /**
                                            * Discriminator for a Viv entity reference.
                                            */
                                           readonly type: ExpressionDiscriminator.EntityReference;
                                           /**
                                            * The actual expression value.
                                            */
                                           readonly value: ReferenceValue;
                                       }

                                       /**
                                        * Enum containing discriminators for the Viv entity types.
                                        *
                                        * @category Other
                                        */
                                       export declare enum EntityType {
                                           /**
                                            * A character in a simulated storyworld.
                                            *
                                            * In Viv, characters can serve in character roles, including `initiator` roles, and they form
                                            * memories when they experience or otherwise learn about actions.
                                            *
                                            * The host application must be able to furnish a {@link CharacterView} for any character, via
                                            * {@link HostApplicationAdapter.getEntityView}, and it must be able to furnish IDs for all characters
                                            * that are currently situated at a specified location, via {@link HostApplicationAdapter.getEntityIDs}.
                                            */
                                           Character = "character",
                                           /**
                                            * An item or prop or artifact in a simulated storyworld.
                                            *
                                            * In Viv, items are entities that can be cast in `item` roles, and on which knowledge of past
                                            * actions may be {@link ItemView.inscriptions}. Items do not take action or form
                                            * memories, but otherwise the exact sense of 'item' will depend on your host application.
                                            *
                                            * The host application must be able to furnish an {@link ItemView} for any item, via
                                            * {@link HostApplicationAdapter.getEntityView}, and it must be able to furnish IDs for all items
                                            * that are currently situated at a specified location, via {@link HostApplicationAdapter.getEntityIDs}.
                                            */
                                           Item = "item",
                                           /**
                                            * A location in a simulated storyworld.
                                            *
                                            * In Viv, locations are entities that can be cast in `location` roles.
                                            *
                                            * The host application must be able to furnish a {@link LocationView} for any location, via
                                            * {@link HostApplicationAdapter.getEntityView}, and it must be able to furnish IDs for all
                                            * locations in the storyworld at hand, via {@link HostApplicationAdapter.getEntityIDs}.
                                            */
                                           Location = "location",
                                           /**
                                            * An action that has occurred in a simulated storyworld.
                                            *
                                            * In Viv, actions are treated as entities that can be cast in `action` roles.
                                            *
                                            * The host application must be able to furnish an {@link ActionView} for any action, via
                                            * {@link HostApplicationAdapter.getEntityView}, and it must be able to furnish all actions
                                            * in the storyworld at hand, via {@link HostApplicationAdapter.getEntityIDs}.
                                            */
                                           Action = "action"
                                       }

                                       /**
                                        * A read-only data view describing an entity in a host application.
                                        *
                                        * An 'entity' in Viv parlance is a character, location, item, or action. In terms of operational semantics,
                                        * it is something for which an entity ID must be provisioned (by the host application), such that any call
                                        * to {@link HostApplicationAdapter.getEntityView} with that entity ID will return a read-only entity view.
                                        *
                                        * Minimally, the entity view must contain a few required fields, but generally it should contain any custom
                                        * fields that are referenced in your Viv code, so that conditions and other expressions can be evaluated.
                                        *
                                        * The host application is responsible for furnishing entity views in the formats that inherit from this shape --
                                        * {@link CharacterView}, {@link ItemView}, {@link LocationView}, and {@link ActionView} -- and as such it is also
                                        * responsible for persisting the entity data undergirding those views.
                                        *
                                        * That said, the host application is free to model and persist this underlying data using
                                        * whatever representations and methods its developers see fit. For instance, you might store
                                        * a compact representation that is expanded into a richer view with derived properties. The
                                        * key is to ensure that the actual underlying representation can be modified via calls to
                                        * {@link HostApplicationAdapter.updateEntityProperty}, if implemented, and/or any
                                        * {@link CustomFunction}.
                                        *
                                        * @category Integration
                                        */
                                       export declare interface EntityView {
                                           /**
                                            * Discriminator for the entity type.
                                            */
                                           readonly entityType: EntityType;
                                           /**
                                            * A unique identifier for the entity.
                                            */
                                           readonly id: UID;
                                           /**
                                            * Additional properties whose structure depends entirely on the host application, with the caveat
                                            * that the Viv runtime expects a plain object all the way down. As such, the values embedded here
                                            * should not include types like functions or members of custom classes, but rather exclusively the
                                            * types defined in the `ExpressionValue` union.
                                            */
                                           [key: string]: ExpressionValue;
                                       }

                                       /**
                                        * A Viv enum. Enums are resolved at runtime using the host application's Viv adapter.
                                        */
                                       declare interface Enum extends SourceAnnotatedExpression {
                                           /**
                                            * Discriminator for a Viv enum.
                                            */
                                           readonly type: ExpressionDiscriminator.Enum;
                                           /**
                                            * The actual expression value.
                                            */
                                           readonly value: EnumValue;
                                       }

                                       /**
                                        * A unique label for an enum value.
                                        *
                                        * @category Other
                                        */
                                       export declare type EnumName = string;

                                       /**
                                        * The actual expression value for a Viv enum.
                                        */
                                       declare interface EnumValue {
                                           /**
                                            * The name of the enum.
                                            *
                                            * This must be resolvable by the host application at runtime.
                                            */
                                           readonly name: EnumName;
                                           /**
                                            * Whether to flip the sign of a numeric value associated with the enum.
                                            */
                                           readonly minus: boolean;
                                       }

                                       /**
                                        * A Viv evaluation context, which is a data structure that is needed by the
                                        * interpreter to evaluate Viv expressions at runtime.
                                        */
                                       declare type EvaluationContext = EvaluationContextSpecialFields & EvaluationContextSpecialRoleBindings & EvaluationContextSingletonRoleBindings;

                                       /**
                                        * Catch-all for singleton role bindings that will be placed in an evaluation context, where the
                                        * role names are keys and various kinds of values (see below) may serve as property values.
                                        *
                                        * Note that only singleton roles (min=1, max=1) are hoisted into the top level. All group roles, including
                                        * optional singleton roles (min=0, max=1) are handled via the special `__groups__` property.
                                        */
                                       declare type EvaluationContextSingletonRoleBindings = {
                                           [K in RoleName]?: SingletonRoleEvaluationContextValue;
                                       };

                                       /**
                                        * Special fields that may be present in evaluation contexts.
                                        */
                                       declare interface EvaluationContextSpecialFields {
                                           /**
                                            * For all *group roles* in the action, meaning ones with multiple slots (max\>1), this maps
                                            * the name of the group role to an array containing either IDs for all entities cast in the role
                                            * or the literal values in the case of a symbol role.
                                            *
                                            * Note that optional singleton roles (min=0, max=1) are not considered group roles and thus are
                                            * not stored here. Also note that the actual arrays will be homogeneous in terms of type: only
                                            * a symbol role may take symbol bindings, and symbol roles only allow symbol bindings. But from
                                            * a TypeScript perspective, it's easiest to union over the element type here.
                                            */
                                           readonly __groups__: Record<RoleName, GroupMember[]>;
                                           /**
                                            * A temporary store for reading and writing local variables, whose lifespan is limited to the
                                            * execution of post-hoc action material, like scratch operations, effects, and reactions.
                                            *
                                            * Viv authors usually create local variables in loop bodies, where they are transient only within
                                            * the loop scope. Local variables are also used to compute saliences and assocations.
                                            */
                                           readonly __locals__: Record<VariableName, ExpressionValue>;
                                           /**
                                            * An array containing entity IDs for all the actions that should be recorded as causes for
                                            * any reactions to the one at hand, should any be successfully performed in the future.
                                            *
                                            * We need to store these here to propagate them to the interpreter, since that module is
                                            * the one that ultimately evaluates reaction declarations to queue actions.
                                            */
                                           __causes__?: UID[];
                                           /**
                                            * A prepared search domain, ready for use in story sifting.
                                            *
                                            * A search domain must be present in order to execute a {@link ActionSearch} or a
                                            * {@link Sifting}, and we need to store this in the evaluation context to allow for
                                            * action searches and/or siftings that nest other action searches and/or siftings. In such cases,
                                            * we narrow the search domain to the intersection of the enclosing search domain and the search
                                            * domain specified for the nested action search or sifting.
                                            */
                                           __searchDomain__?: SearchDomain;
                                           /**
                                            * The type of construct that is current being targeted.
                                            *
                                            * This is used purely for debugging purposes, because it's often helpful in error messages to
                                            * identify the target construct at hand.
                                            */
                                           readonly __constructType__?: ConstructDiscriminator;
                                           /**
                                            * Name of the construct that is currently being targeted.
                                            *
                                            * This is used purely for debugging purposes, because it's often helpful in error messages to
                                            * identify the target construct at hand.
                                            */
                                           readonly __constructName__?: ConstructName;
                                       }

                                       /**
                                        * Entries for the Viv special roles `@this` and `@hearer`.
                                        *
                                        * `@this` is always bound to the entity ID for the action at hand, enabling an author to do things
                                        * like precast the action at hand in reaction bindings. This field is only set once the action has
                                        * been constructed, prior to the execution of effects and so forth.
                                        *
                                        * `@hearer` is always bound to the entity ID who is hearing about an action after the fact. This role is
                                        * only cast when a character participates in, observes, or learns about an action A2 that casts another
                                        * action A1 in one of its roles. In such cases, A2 is said to relay knowledge about A1. (Note that if A1
                                        * were to relay knowledge about another action A0, someone learning about A2 would not receive knowledge
                                        * about A0 -- in other words, knowledge relaying only works by one chain link at a time.) This role can
                                        * be referenced in effects, reactions, saliences, and associations, supporting patterns like queueing
                                        * a reaction to be performed by someone who hears about the action at hand. Note that a character who
                                        * directly participated in the original action will still be cast as `@hearer` if they are to hear
                                        * about the action via a subsequent one.
                                        */
                                       declare type EvaluationContextSpecialRoleBindings = {
                                           [key in SpecialRoleName]?: UID;
                                       };

                                       /**
                                        * A Viv expression.
                                        */
                                       declare type Expression = ActionRelation | ActionSearch | CustomFunctionCall | ArithmeticExpression | Assignment | BoolField | ChanceExpression | Comparison | Conditional | Conjunction | Disjunction | EntityReference | Enum | FloatField | Inspection | Inscription | IntField | ListField | Loop | MembershipTest | MemoryCheck | NullField | ObjectField | Reaction | Sifting | StringField | SymbolReference | TemplateStringField | TropeFit;

                                       /**
                                        * Enum specifying the discriminators for all Viv expression types.
                                        */
                                       declare enum ExpressionDiscriminator {
                                           /**
                                            * Discriminator for Viv action relations.
                                            */
                                           ActionRelation = "actionRelation",
                                           /**
                                            * Discriminator for Viv action searches.
                                            */
                                           ActionSearch = "actionSearch",
                                           /**
                                            * Discriminator for Viv assignments.
                                            */
                                           Assignment = "assignment",
                                           /**
                                            * Discriminator for Viv arithmetic expressions.
                                            */
                                           ArithmeticExpression = "arithmeticExpression",
                                           /**
                                            * Discriminator for Viv booleans.
                                            */
                                           Bool = "bool",
                                           /**
                                            * Discriminator for Viv chance expressions.
                                            */
                                           ChanceExpression = "chanceExpression",
                                           /**
                                            * Discriminator for Viv comparisons.
                                            */
                                           Comparison = "comparison",
                                           /**
                                            * Discriminator for Viv conditionals.
                                            */
                                           Conditional = "conditional",
                                           /**
                                            * Discriminator for Viv conjunctions.
                                            */
                                           Conjunction = "conjunction",
                                           /**
                                            * Discriminator for Viv custom function calls.
                                            */
                                           CustomFunctionCall = "customFunctionCall",
                                           /**
                                            * Discriminator for Viv disjunctions.
                                            */
                                           Disjunction = "disjunction",
                                           /**
                                            * Discriminator for Viv entity references.
                                            */
                                           EntityReference = "entityReference",
                                           /**
                                            * Discriminator for Viv enums.
                                            */
                                           Enum = "enum",
                                           /**
                                            * Discriminator for Viv floating-point numbers.
                                            */
                                           Float = "float",
                                           /**
                                            * Discriminator for Viv item inspections.
                                            */
                                           Inspection = "inspection",
                                           /**
                                            * Discriminator for Viv item inscription events.
                                            */
                                           Inscription = "inscription",
                                           /**
                                            * Discriminator for Viv integers.
                                            */
                                           Int = "int",
                                           /**
                                            * Discriminator for Viv lists.
                                            */
                                           List = "list",
                                           /**
                                            * Discriminator for Viv loops.
                                            */
                                           Loop = "loop",
                                           /**
                                            * Discriminator for Viv membership tests.
                                            */
                                           MembershipTest = "membershipTest",
                                           /**
                                            * Discriminator for Viv memory checks.
                                            */
                                           MemoryCheck = "memoryCheck",
                                           /**
                                            * Discriminator for the Viv null literal.
                                            */
                                           NullType = "nullType",
                                           /**
                                            * Discriminator for Viv object literals.
                                            */
                                           Object = "object",
                                           /**
                                            * Discriminator for Viv reactions.
                                            */
                                           Reaction = "reaction",
                                           /**
                                            * Discriminator for Viv sifting expressions.
                                            */
                                           Sifting = "sifting",
                                           /**
                                            * Discriminator for Viv string literals.
                                            */
                                           String = "string",
                                           /**
                                            * Discriminator for Viv symbol references.
                                            */
                                           SymbolReference = "symbolReference",
                                           /**
                                            * Discriminator for Viv template strings.
                                            */
                                           TemplateString = "templateString",
                                           /**
                                            * Discriminator for Viv trope-fit expressions.
                                            */
                                           TropeFit = "tropeFit"
                                       }

                                       /**
                                        * Union containing the possible types for evaluated Viv expressions.
                                        *
                                        * @category Other
                                        */
                                       export declare type ExpressionValue = string | number | boolean | null | undefined | symbol | UID | EntityView | TimeOfDay | CharacterMemory | unknown[] | Record<string, unknown>;

                                       /**
                                        * Invokes the knowledge manager to fade all character memories.
                                        *
                                        * This procedure works by reducing all memory `salience` values according to the amount of time
                                        * that has passed since last invocation of this procedure and the configured rate of forgetting,
                                        * which is specified in {@link HostApplicationAdapterConfig}.
                                        *
                                        * @category Knowledge
                                        * @example
                                        * ```ts
                                        * await fadeCharacterMemories();
                                        * ```
                                        * @see Memory-related configuration parameters in {@link HostApplicationAdapterConfig}.
                                        * @returns Nothing. Memories are faded via side effects.
                                        * @throws {@link VivNotInitializedError} If Viv is not initialized.
                                            */
                                        export declare function fadeCharacterMemories(): Promise<void>;

                                        /**
                                         * Mixin for expression components that may fail safely.
                                         */
                                        declare interface FailSafeComponent {
                                            /**
                                             * Whether the expression component should fail safely by converting a nullish evaluation
                                             * into the falsy 'eval fail-safe signal'.
                                             *
                                             * This allows for references whose (intermediate) references may be undefined, as in `@foo.bar?.baz`.
                                             */
                                            readonly failSafe: boolean;
                                        }

                                        /**
                                         * A Viv floating-point number.
                                         */
                                        declare interface FloatField extends SourceAnnotatedExpression {
                                            /**
                                             * Discriminator for a Viv floating-point number.
                                             */
                                            readonly type: ExpressionDiscriminator.Float;
                                            /**
                                             * The float literal to which this expression will evaluate.
                                             */
                                            readonly value: number;
                                        }

                                        /**
                                         * Returns debugging data stored in the Viv runtime's internal state.
                                         *
                                         * @category Debugging
                                         * @example
                                         * ```ts
                                         * await getDebuggingData();
                                         * ```
                                         * @see The supported debugging parameters on {@link HostApplicationAdapter.debug}.
                                         * @returns See {@link GetDebuggingDataResult}.
                                         * @throws {@link VivNotInitializedError} If Viv is not initialized.
                                             * @throws {@link VivValidationError} If the Viv runtime's internal state contains no debugging data, which occurs
                                                 *     when the host application's Viv adapter is not configured for the collection of debugging data.
                                                 */
                                             export declare function getDebuggingData(): Promise<GetDebuggingDataResult>;

                                             /**
                                              * Debugging data stored in the Viv runtime's internal state.
                                              *
                                              * @category Other
                                              * @remarks This is the return value for {@link getDebuggingData}.
                                              */
                                             export declare type GetDebuggingDataResult = VivInternalStateDebugging;

                                             /**
                                              * Returns the supported Viv content-bundle schema version supported by this runtime.
                                              *
                                              * This will be a string in semver notation (e.g., `"1.0.16"`), and compatibility will be enforced
                                              * between this version number and the one stamped into a content bundle being registered.
                                              *
                                              * @category Initialization
                                              * @example
                                              * ```ts
                                              * console.log(getSchemaVersion());
                                              * ```
                                              * @returns - See {@link GetSchemaVersionResult}.
                                              */
                                             export declare function getSchemaVersion(): GetSchemaVersionResult;

                                             /**
                                              * The supported Viv content-bundle schema version supported by this runtime,
                                              * which is a string in semver notation (e.g., `"1.0.16"`).
                                              *
                                              * @category Other
                                              * @remarks This is the return value for {@link getSchemaVersion}.
                                              */
                                             export declare type GetSchemaVersionResult = string;

                                             /**
                                              * Union containing the possible types for binding arrays associated with group roles.
                                              *
                                              * Note that a group role cannot mix entities and symbols, hence the union being over homogeneous arrays.
                                              */
                                             declare type GroupMember = UID | SymbolRoleBinding;

                                             /**
                                              * A collection of functions and other parameters that are required by the runtime in order
                                              * to properly integrate with a host application.
                                              *
                                              * Note that the Viv runtime does not catch or wrap exceptions thrown by adapter functions. As such,
                                              * if an adapter function throws, the error will propagate through the runtime and find its way back
                                              * to the caller, with its original type and stack trace intact.
                                              *
                                              * As such, you can use `instanceof` to distinguish between Viv errors (always an instance of {@link VivError})
                                              * and your own adapter errors (any other error type):
                                              *
                                              * ```ts
                                              * try {
                                              *     const actionID = await selectAction({ initiatorID });
                                              * } catch (error) {
                                              *     if (error instanceof VivError) {
                                              *         // Something went wrong in the Viv runtime (e.g., a bad expression,
                                              *         // a role-casting issue, or a validation failure).
                                              *     } else {
                                              *         // Something went wrong in your adapter (e.g., a failed database
                                              *         // query, a missing entity, or a bug in a custom function).
                                              *     }
                                              * }
                                              * ```
                                              *
                                              * **Important:** Viv assumes that it can freely mutate the furnished data, with any actual
                                              * updates being persisted via calls to the explicit adapter functions specified in the
                                              * documentation below, so be sure to clone data as needed.
                                              *
                                              * @category Integration
                                              */
                                             export declare interface HostApplicationAdapter {
                                                 /**
                                                  * A function that accepts an entity ID and returns the full entity view for that entity,
                                                  * if there is such an entity, else throws an error.
                                                  *
                                                  * This function is used by the runtime to evaluate expressions such as conditions and effects. Note that
                                                  * the runtime will be careful to only pass an actual entity ID for `entityID`. How exactly the entity data
                                                  * is persisted is a nuance of the host application that is abstracted from the Viv runtime via the adapter
                                                  * interface. If fetching is expensive -- e.g., because it persists in a DB -- you might consider implementing
                                                  * caching in your application.
                                                  *
                                                  * **Important:** Viv assumes that it can freely mutate the furnished data, with any actual updates being
                                                  * persisted via an adapter function (or {@link CustomFunction}), so be sure to clone as needed.
                                                  *
                                                  * @param entityID - The entity ID for the entity whose data is to be returned.
                                                  * @returns The requested entity view.
                                                  * @throws If there is no entity with the given entity ID.
                                                  */
                                                 readonly getEntityView: (entityID: UID) => AsyncOrSync<EntityView>;
                                                 /**
                                                  * A function that accepts a record describing an action and saves the underlying data
                                                  * in the host application.
                                                  *
                                                  * This function is called both to create new action records and to update existing action records.
                                                  *
                                                  * **Important:** The action record must be persisted such that any subsequent call to
                                                  * {@link HostApplicationAdapter.getEntityView} (with `entityID`) must produce an {@link ActionView}.
                                                  *
                                                  * Note: If {@link HostApplicationAdapter.updateEntityProperty} is implemented, Viv authors will be free
                                                  * to directly set action data via assignments. How that works behind the scenes depends on the host application.
                                                  *
                                                  * @param actionID - Entity ID for the action.
                                                  * @param actionData - Action data in the shape of an {@link ActionView}.
                                                  * @returns Nothing.
                                                  */
                                                 readonly saveActionData: (actionID: UID, actionData: ActionView) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that accepts a record describing a character memory and saves the underlying data
                                                  * in the host application.
                                                  *
                                                  * This function is called both to create new character memories and to update existing ones.
                                                  *
                                                  * **Important:** The memory record must be persisted such that any subsequently retrieved
                                                  * {@link CharacterView} for the character in question will include the memory data in its
                                                  * {@link CharacterView.memories} field.
                                                  *
                                                  * @param characterID - Entity ID for the character whose memory is to be saved.
                                                  * @param actionID - Entity ID for the action to which the memory pertains.
                                                  * @param memory - A record specifying the memory to save.
                                                  * @returns Nothing.
                                                  */
                                                 readonly saveCharacterMemory: (characterID: UID, actionID: UID, memory: CharacterMemory) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that accepts an item and updated inscriptions for that item and saves the
                                                  * underlying data in the host application.
                                                  *
                                                  * **Important:** The inscriptions must be persisted such that any subsequently retrieved
                                                  * {@link ItemView} for the item in question will include the inscriptions value in its
                                                  * {@link ItemView.inscriptions} field.
                                                  *
                                                  * @param itemID - Entity ID for the item whose inscriptions are to be saved.
                                                  * @param inscriptions - Array containing entity IDs for all actions about which the given item
                                                  *     inscribes knowledge. This will always be deduplicated prior to calling this function.
                                                  * @returns Nothing.
                                                  */
                                                 readonly saveItemInscriptions: (itemID: UID, inscriptions: UID[]) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that returns the internal state of the Viv runtime, if it has been initialized, else `null`.
                                                  *
                                                  * While the Viv runtime will manage its own internal state, it relies on the host application to persist it.
                                                  *
                                                  * If the internal state has not been initialized -- i.e., the runtime has never called
                                                  * {@link HostApplicationAdapter.saveVivInternalState} -- then you should return `null` here.
                                                  *
                                                  * @returns The persisted internal state of the Viv runtime, if it has been initialized, else `null`.
                                                  */
                                                 readonly getVivInternalState: () => AsyncOrSync<VivInternalState | null>;
                                                 /**
                                                  * A function that accepts updated internal state for the Viv runtime, and then
                                                  * persists the updated state in the host application.
                                                  *
                                                  * @param vivInternalState - The updated Viv internal state to set.
                                                  * @returns Nothing.
                                                  */
                                                 readonly saveVivInternalState: (vivInternalState: VivInternalState) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that returns an array containing entity IDs for entities of the given type
                                                  * in the running simulation instance of the host application.
                                                  *
                                                  * If a location is specified, the result should be limited to entities currently situated at that
                                                  * location. Otherwise, the result should contain entity IDs for all entities of the given type.
                                                  *
                                                  * **Important:** Viv considers a character or item to be at a location if the entity's `location`
                                                  * property (in its {@link CharacterView} or {@link ItemView}) stores the entity ID for that location.
                                                  * Also, Viv assumes that it can freely mutate the furnished array, so be sure to clone as needed.
                                                  *
                                                  * @param entityType - The type of entity for which entity IDs will be furnished.
                                                  * @param locationID - If specified, the entity ID for a location to search for entities,
                                                  *     which should only be submitted for characters and items.
                                                  * @returns An array of entity IDs.
                                                  * @throws If `locationID` is present but `entityType` is not {@link EntityType.Character}
                                                  *     or {@link EntityType.Item}.
                                                  */
                                                 readonly getEntityIDs: (entityType: EntityType, locationID?: UID) => AsyncOrSync<UID[]>;
                                                 /**
                                                  * A function that returns a newly provisioned entity ID for an action.
                                                  *
                                                  * Note that this function is used to request IDs for queued actions that may never actually
                                                  * be performed. As such, not all IDs provisioned by this function will actually come to be
                                                  * associated with recorded actions.
                                                  *
                                                  * This is the only case where a {@link UID} will need to be provisioned for Viv, because entities
                                                  * created as a result of Viv actions will be initialized via a custom function specified
                                                  * in the `spawn` field of a role definition.
                                                  *
                                                  * @returns A newly provisioned entity ID.
                                                  */
                                                 readonly provisionActionID: () => AsyncOrSync<UID>;
                                                 /**
                                                  * A function that returns the current timestamp (in story time) in the running simulation
                                                  * instance associated with the host application.
                                                  *
                                                  * Here, *story time* refers to the concept of time **within** the storyworld being simulated
                                                  * by the host application, as opposed to clock time in the real world as the host application
                                                  * operates. In other words, diegetic time.
                                                  *
                                                  * **Important:** Viv assumes that a {@link DiegeticTimestamp} is represented as the number of
                                                  * minutes, in story time, that have passed since some initial reference point in the simulation. The
                                                  * starting point that is used for this determination is up to you, but the time unit must be minutes.
                                                  *
                                                  * This allows the Viv runtime to properly handle authored temporal constraints in reaction declarations,
                                                  * which allow for semantics such as "this reaction can only occur between one week and six months from now".
                                                  *
                                                  * @returns The current diegetic timestamp for the simulation at hand.
                                                  */
                                                 readonly getCurrentTimestamp: () => AsyncOrSync<DiegeticTimestamp>;
                                                 /**
                                                  * A function that accepts an ID for an entity and returns a label for the entity, such as its name,
                                                  * that is suitable for insertion into a templated string.
                                                  *
                                                  * For example, a Viv author might write a templated string `"@giver gives @item to @receiver"`,
                                                  * which the interpreter will have to render by replacing the references `@giver`, `@item`, and
                                                  * `@receiver` with strings.
                                                  *
                                                  * To do this, the runtime will call this function for each reference. Note that, for references to values
                                                  * that are not entity IDs, the value itself will be inserted without any calls to an adapter function,
                                                  * as in `@giver.name gives { ~getItemDescription(@item.id) } to @receiver.name`.
                                                  *
                                                  * @param entityID - ID for the entity for whom a label is being requested.
                                                  * @returns The label for the entity.
                                                  */
                                                 readonly getEntityLabel: (entityID: UID) => AsyncOrSync<string>;
                                                 /**
                                                  * If implemented, a function that returns the current time of day (in story time) in the
                                                  * running simulation instance associated with the host application.
                                                  *
                                                  * Here, *story time* refers to the concept of time **within** the storyworld being simulated by the
                                                  * host application, as opposed to clock time in the real world as the host application operates.
                                                  * This function is needed in order to enforce time-of-day constraints that Viv authors may place on
                                                  * actions, specifying concerns such as "this reaction may only be performed between 10pm and 11:59pm".
                                                  *
                                                  * If your simulation does not model time of day, you can leave this one out, in which case the adapter
                                                  * validator will ensure that no reactions in your content bundle reference time of day.
                                                  *
                                                  * @returns The current simulation time of day.
                                                  */
                                                 readonly getCurrentTimeOfDay?: () => AsyncOrSync<TimeOfDay>;
                                                 /**
                                                  * If implemented, a function that updates the given entity's data by setting the property at the specified path.
                                                  *
                                                  * If this adapter function is not provided, entity data may only be updated via calls to
                                                  * {@link CustomFunction}. Further, the validator will ensure that no
                                                  * assignments in your content bundle target entities.
                                                  *
                                                  * **Important:** Viv supports *autovivification* (no pun intended), where an author may reference potentially
                                                  * undefined substructures along a path that will be created as needed. As such, in your procedure backing this
                                                  * adapter function, all intermediate objects along `propertyPath` must be created if they do not already exist.
                                                  *
                                                  * As an illustrative example, in Viv the assignment `@person.foo.bar.baz = 77` is still valid even if
                                                  * `@person.foo` does not yet have a `bar` property. As such, your update procedure would have to set
                                                  * `@person.foo.bar` to an object `{baz: 77}` in this case. When setting local variables, which do not need
                                                  * to persist in the host application, the Viv runtime uses the default autovivification semantics of the
                                                  * Lodash `set()` function when it's given an array path: when a missing intermediate value is encountered,
                                                  * make it an array only  if the next key is a non-negative integer, otherwise make it a plain object.
                                                  *
                                                  * @param entityID - The entity ID of the entity whose data is to be updated.
                                                  * @param propertyPath - A path to the particular property of the entity data that is to be updated, structured
                                                  *     as an array of property keys and/or array indices -- examples: `["friends", 2, "status"]` and
                                                  *     `["nearby", "artifacts.treatise", "school of thought"]`. Note that property keys are arbitrary strings
                                                  *     that may contain dots, whitespace, or any other character. If you plan to convert the path array into
                                                  *     a string so that you can use something like Lodash to execute the entity update, you'll need to take
                                                  *     care to ensure that your conversion procedure is properly robust. And again, as stated above, you must
                                                  *     support autovivification for any undefined substructures along this property path.
                                                  * @param value - The value to set for the property specified by `propertyPath`.
                                                  * @returns Nothing.
                                                  */
                                                 readonly updateEntityProperty?: (entityID: UID, propertyPath: (string | number)[], value: unknown) => AsyncOrSync<void>;
                                                 /**
                                                  * If supplied, configuration parameters controlling various aspects of Viv system behavior. Default
                                                  * values will be used for parameters that are not supplied.
                                                  */
                                                 readonly config?: HostApplicationAdapterConfig;
                                                 /**
                                                  * If supplied, a mapping from enum names to their associated literal values in the host application.
                                                  *
                                                  * In Viv, *enums* are abstract labels like `#BIG` or `#SMALL` that may be used in places like effects, in
                                                  * lieu of magic numbers (or strings) that are prone to changing. For instance, an author could specify an
                                                  * effect like `@insulted.updateAffinity(@insulter, -#MEDIUM)`, which specifies that someone who has just
                                                  * been insulted should greatly lower their affinity toward their insulter. For various reasons, this is
                                                  * preferable to something like `@insulted.updateAffinity(@insulter, -35)`.
                                                  *
                                                  * Upon adapter registration, the Viv runtime will confirm that all enums referenced in your content
                                                  * bundle are present in this mapping here.
                                                  */
                                                 readonly enums?: Record<EnumName, number | string>;
                                                 /**
                                                  * If supplied, a mapping from custom-function names to {@link CustomFunction}.
                                                  *
                                                  * A host application can expose arbitrary functions in its Viv adapter, which authors can reference
                                                  * using the `~` sigil, as in e.g. `~transport(@person.id, @destination.id)`. The author defines the
                                                  * arguments using Viv expressions, which will each be evaluated prior to being passed into the actual
                                                  * custom function. The custom function is expected to return an expression value, which is a highly
                                                  * permissive union of various types.
                                                  *
                                                  * **Important:** Viv will dehydrate all arguments prior to passing them into a custom function, meaning
                                                  * any instance of entity data will be converted into its corresponding entity ID. This allows an author
                                                  * to write something like `~move(@person, @destination)` without having to worry about whether to pass
                                                  * in the respective `id` properties.
                                                  */
                                                 readonly functions?: Record<CustomFunctionName, CustomFunction>;
                                                 /**
                                                  * If supplied, a collection of optional functions implementing frequent read and write operations,
                                                  * so as to be optimized according to implementation details specific to the host application at hand.
                                                  */
                                                 readonly fastPaths?: HostApplicationAdapterFastPaths;
                                                 /**
                                                  * If supplied, settings activating debugging facilities of the Viv runtime.
                                                  */
                                                 readonly debug?: HostApplicationAdapterDebuggingSettings;
                                             }

                                             /**
                                              * Configuration parameters controlling various aspects of Viv system behavior.
                                              *
                                              * @category Integration
                                              */
                                             export declare interface HostApplicationAdapterConfig {
                                                 /**
                                                  * The maximum number of iterations to allow in a Viv loop. Rather than throwing an error if
                                                  * the threshold is reached, the runtime will simply exit the loop.
                                                  *
                                                  * @defaultValue 999
                                                  */
                                                 readonly loopMaxIterations?: number;
                                                 /**
                                                  * If specified, the maximum salience value for character memories.
                                                  *
                                                  * Clamping will not occur if this field is elided or set to `null`.
                                                  *
                                                  * Note that saliences accumulate as memories are *re-experienced* -- re-experiencing happens when the
                                                  * memory's subject action is cast in another action that the character experiences, observes, or hears
                                                  * about. As such, saliences have no explicit upper bound given a content bundle, even if you e.g. use
                                                  * enum values to specify salience increments. This parameter allows you to specify such an upper bound.
                                                  */
                                                 readonly memoryMaxSalience?: number | null;
                                                 /**
                                                  * A number specifying the degree to which character memories will be retained month over month.
                                                  *
                                                  * This important config parameter drives the modeling of characters gradually forgetting past events.
                                                  * I recommend a value around `0.9` here, but you might have your own intuitions (or empirical methods).
                                                  *
                                                  * Specifically, the value here must be a number between `0.0` (characters quickly forget everything) and
                                                  * `1.0` (characters never forget anything). With each passing month, a given character's salience value
                                                  * will be multiplied by this number to model how much the character's memory faded over that time.
                                                  *
                                                  * For instance, if the character's current salience is `10` and the value set here is `0.9`, the
                                                  * character's updated salience after one month would be `9`. If another month passed without the
                                                  * character *re-experiencing* the memory -- re-experiencing happens when the memory's subject action
                                                  * is cast in another action that the character experiences, observes, or hears about -- the salience
                                                  * would be further reduced to `8.1`. And so forth.
                                                  *
                                                  * If ever the salience is reduced to a number below the threshold set via
                                                  * `memoryForgettingSalienceThreshold`, the memory will be marked
                                                  * {@link CharacterMemory.forgotten}, to model total forgetting of the past event.
                                                  *
                                                  * Note that the salience scale will always be (`memoryForgettingSalienceThreshold`,
                                                  * `memoryMaxSalience`] -- or (`memoryForgettingSalienceThreshold`, `Infinity`) if
                                                  * `memoryForgettingSalienceThreshold` is not defined -- where the meaning of a given value is
                                                  * entirely defined by your host application. This lower bound is established because any initial
                                                  * salience value less than or equal to `memoryForgettingSalienceThreshold` will prevent the
                                                  * associated memory from being formed in the first place.
                                                  *
                                                  * **Important:** We use a timeframe of one month here only to support designer intuitions around forgetting,
                                                  * since it would be difficult to reason about e.g. the degree to which one forgets a past event each
                                                  * minute. The actual frequency of memory fading depends on the frequency with which the host application
                                                  * invokes {@link fadeCharacterMemories} -- but that function will always convert the time since the last invocation
                                                  * into a number of months, so as to always honor your config parameter here.
                                                  *
                                                  * @defaultValue 0.9
                                                  */
                                                 readonly memoryRetentionMonthlyMultiplier?: number;
                                                 /**
                                                  * A positive number specifying a salience threshold for memories, below which memories will be forgotten.
                                                  *
                                                  * Viv models character memories fading over time by reducing salience during periods where a memory
                                                  * is not *re-experienced* by a character -- re-experiencing happens when the memory's subject action
                                                  * is cast in another action that the character experiences, observes, or hears about. This is driven
                                                  * by the value set in `memoryRetentionMonthlyMultiplier`.
                                                  *
                                                  * If ever a salience value is reduced such that this threshold exceeds it, the associated memory
                                                  * will be marked {@link CharacterMemory.forgotten}, to model total forgetting of the
                                                  * past event. To be clear, we only do this if the salience value is strictly less than the threshold.
                                                  *
                                                  * Note that a forgotten memory can be revitalized for a character who relearns about the subject action.
                                                  *
                                                  * **Important:** If the initial salience value for a new memory is lower than this threshold,
                                                  * it will not immediately be marked as forgotten, but instead this will occur the first time
                                                  * the memory is faded (via {@link fadeCharacterMemories}).
                                                  *
                                                  * @defaultValue 0.1
                                                  */
                                                 readonly memoryForgettingSalienceThreshold?: number;
                                             }

                                             /**
                                              * An object identifying constructs to watch.
                                              *
                                              * As part of adapter validation, the runtime will confirm that all the constructs included
                                              * in the watchlists here are in fact defined in the registered content bundle.
                                              *
                                              * @category Other
                                              */
                                             export declare interface HostApplicationAdapterConstructWatchlists {
                                                 /**
                                                  * If specified, an array containing the names of the actions to watch.
                                                  */
                                                 readonly actions?: ActionName[];
                                                 /**
                                                  * If specified, an array containing the names of the action selectors to watch.
                                                  */
                                                 readonly actionSelectors?: SelectorName[];
                                                 /**
                                                  * If specified, an array containing the names of the plans to watch.
                                                  */
                                                 readonly plans?: PlanName[];
                                                 /**
                                                  * If specified, an array containing the names of the plan selectors to watch.
                                                  */
                                                 readonly planSelectors?: SelectorName[];
                                                 /**
                                                  * If specified, an array containing the names of the queries to watch.
                                                  */
                                                 readonly queries?: QueryName[];
                                                 /**
                                                  * If specified, an array containing the names of the sifting patterns to watch.
                                                  */
                                                 readonly siftingPatterns?: SiftingPatternName[];
                                                 /**
                                                  * If specified, an array containing the names of the tropes to watch.
                                                  */
                                                 readonly tropes?: TropeName[];
                                             }

                                             /**
                                              * Configuration parameters controlling activation of the Viv runtime's debugging facilities.
                                              *
                                              * @category Other
                                              */
                                             export declare interface HostApplicationAdapterDebuggingSettings {
                                                 /**
                                                  * Whether to carry out structural validation (against a schema) of all calls to the Viv
                                                  * runtime's API functions (e.g., `selectAction()`).
                                                  *
                                                  * This will produce more informative error messages for malformed calls, at the cost of
                                                  * some overhead per call. As such, this setting is most useful during initial integration
                                                  * of Viv into a host application.
                                                  */
                                                 readonly validateAPICalls?: boolean;
                                                 /**
                                                  * An object identifying constructs to *watch*.
                                                  *
                                                  * When a construct is being watched, {@link WatchedConstructDebuggingState}
                                                  * is collected whenever it is targeted. This information can be used to investigate why a construct
                                                  * has not been successfully targeted, especially if this is due to something like a mistyped condition.
                                                  */
                                                 readonly watchlists?: HostApplicationAdapterConstructWatchlists;
                                                 /**
                                                  * An object specifying *observability callbacks* to register with the Viv runtime.
                                                  *
                                                  * Observability callbacks cause the runtime to emit events that support real-time observability
                                                  * into processes such as action selection and plan execution. These events can be processed by
                                                  * the host application to drive debugging facilities pertaining to the Viv integration.
                                                  *
                                                  * **Important:** Observability callbacks slow down the runtime, and thus should only be used
                                                  * when the host application's Viv integration is being debugged or otherwise monitored.
                                                  */
                                                 readonly callbacks?: HostApplicationAdapterObservabilityCallbacks;
                                             }

                                             /**
                                              * A collection of optional functions implementing frequent read and write operations, so as to be
                                              * optimized according to implementation details specific to the host application at hand.
                                              *
                                              * All the entries here are optional. If a given entry isn't present, the Viv runtime will
                                              * use a corresponding naive procedure with the same semantics. For instance, if an
                                              * {@link HostApplicationAdapter.updateEntityProperty} fast path is not supplied, the Viv
                                              * runtime will read the complete entity data, mutate it to capture the property update,
                                              * and then write the complete updated entity data.
                                              *
                                              * @category Integration
                                              */
                                             export declare interface HostApplicationAdapterFastPaths {
                                                 /**
                                                  * A function that returns whether a given string is the entity ID for some entity in the host application.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to calling
                                                  * {@link HostApplicationAdapter.getEntityView} and catching the errors thrown in cases
                                                  * of undefined entities.
                                                  *
                                                  * This function is used by the runtime to determine whether it needs to hydrate a potential
                                                  * entity ID into an entity view.
                                                  *
                                                  * **Important**: Because Viv's fallback implementation relies on
                                                  * {@link HostApplicationAdapter.getEntityView} throwing an error in the case of a missing
                                                  * entity, you should implement this fast path if your
                                                  * {@link HostApplicationAdapter.getEntityView} can fail for reasons other than a missing
                                                  * entity (e.g., a DB connection issue).
                                                  *
                                                  * @param potentialEntityID - A string whose status as an entity ID is to be tested.
                                                  * @returns Whether the given string is an entity ID.
                                                  */
                                                 readonly isEntityID?: (potentialEntityID: string) => AsyncOrSync<boolean>;
                                                 /**
                                                  * A function that returns the value stored at the specified path in the given entity's data.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to using
                                                  * {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * **Important:** Viv assumes that it can freely mutate the furnished data, with any actual
                                                  * updates being persisted via adapter functions or {@link CustomFunction},
                                                  * so be sure to clone as needed.
                                                  *
                                                  * @param entityID - The entity ID of the entity whose data is to be retrieved.
                                                  * @param propertyPath - A path to the particular property of the entity data that is to be updated, structured
                                                  *     as an array of property keys and/or array indices -- examples: `["targets", 2, "status"]` and
                                                  *     `["stats", "equipment.weapon", "critical hit chance"]`. Note that property keys are arbitrary strings
                                                  *     that may contain dots, whitespace, or any other character. If you plan to convert the path array into
                                                  *     a string so that you can use something like Lodash to carry out the retrieval, you'll need to take
                                                  *     care to ensure that your conversion procedure is properly robust.
                                                  * @returns The value stored at the specified path in the given entity's data.
                                                  * @throws If the property does not exist.
                                                  */
                                                 readonly getEntityProperty?: (entityID: UID, propertyPath: (string | number)[]) => AsyncOrSync<unknown>;
                                                 /**
                                                  * A function that updates the given entity's data by appending the given value to the array
                                                  * property at the specified path, potentially with deduplication.
                                                  *
                                                  * If this fast path is not supplied, this will be implemented using other fast paths,
                                                  * to the degree that they are supplied.
                                                  *
                                                  * **Important:** As explained in {@link HostApplicationAdapterFastPaths.getEntityProperty},
                                                  * Viv supports *autovivification*, a policy that must also be honored here. In addition to
                                                  * creating any intermediate structure, if the property to which the value will be appended
                                                  * does not yet exist, it must be created first.
                                                  *
                                                  * @param entityID - The entity ID of the entity whose data is to be updated.
                                                  * @param propertyPath - A path to the particular property of the entity data that is to be updated, structured
                                                  *     as an array of property keys and/or array indices -- examples: `["friends", 2, "status"]` and
                                                  *     `["nearby", "artifacts.treatise", "school of thought"]`. Note that property keys are arbitrary strings
                                                  *     that may contain dots, whitespace, or any other character. If you plan to convert the path array into
                                                  *     a string so that you can use something like Lodash to execute the entity update, you'll need to take
                                                  *     care to ensure that your conversion procedure is properly robust. And again, as stated above, you must
                                                  *     support autovivification for any undefined substructures along this property path.
                                                  * @param value - The value to append to the property specified by `propertyPath`.
                                                  * @param dedupe - Whether the resulting array property value should have no duplicates. If `true`,
                                                  *     you must only append `value` if it is not already present in the array property.
                                                  * @returns Nothing.
                                                  */
                                                 readonly appendEntityProperty?: (entityID: UID, propertyPath: (string | number)[], value: unknown, dedupe: boolean) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that returns the entity type for the given entity.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to the
                                                  * {@link HostApplicationAdapterFastPaths.getEntityProperty} fast path, if supplied,
                                                  * and otherwise to {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * @param entityID - Entity ID for the entity whose entity type will be returned.
                                                  * @returns The entity type for the given entity.
                                                  */
                                                 readonly getEntityType?: (entityID: UID) => AsyncOrSync<EntityType>;
                                                 /**
                                                  * A function that returns the entity ID for the current location of the given entity.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to the
                                                  * {@link HostApplicationAdapterFastPaths.getEntityProperty} fast path, if supplied,
                                                  * and otherwise to {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * @param entityID - Entity ID for the entity whose location will be returned.
                                                  * @returns The Entity ID for the given entity's current location.
                                                  */
                                                 readonly getEntityLocation?: (entityID: UID) => AsyncOrSync<UID>;
                                                 /**
                                                  * A function that returns the action queue for the character with the given entity ID,
                                                  * if any, else an empty array.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * and pulling the desired action queue from there.
                                                  *
                                                  * @param characterID - Entity ID for the character whose action queue is to be retrieved.
                                                  * @returns The action queue for the character with the given entity ID, if any, else an empty array.
                                                  */
                                                 readonly getActionQueue?: (characterID: UID) => AsyncOrSync<ActionQueue>;
                                                 /**
                                                  * A function that updates the action queue for the character with the given entity ID.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * updating the action queue for the character in question, and setting the entire
                                                  * {@link VivInternalState} via {@link HostApplicationAdapter.saveVivInternalState}.
                                                  *
                                                  * @param characterID - Entity ID for the character whose action queue is to be updated.
                                                  * @param updatedActionQueue - The updated action queue to set.
                                                  * @returns Nothing.
                                                  */
                                                 readonly saveActionQueue?: (characterID: UID, updatedActionQueue: ActionQueue) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that returns the global plan queue contained in the {@link VivInternalState}.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * and pulling the global plan queue from there.
                                                  *
                                                  * @returns The global plan queue contained in the {@link VivInternalState}.
                                                  */
                                                 readonly getPlanQueue?: () => AsyncOrSync<PlanQueue>;
                                                 /**
                                                  * A function that updates the global plan queue contained in the {@link VivInternalState}.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * updating its global plan queue, and setting the entire {@link VivInternalState}
                                                  * via {@link HostApplicationAdapter.saveVivInternalState}.
                                                  *
                                                  * @param updatedPlanQueue - The updated global plan queue to set.
                                                  * @returns Nothing.
                                                  */
                                                 readonly savePlanQueue?: (updatedPlanQueue: PlanQueue) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that returns all active plan states (i.e., the value for the `activePlans` field
                                                  * of the {@link VivInternalState}).
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * and pulling the active plan states from there.
                                                  *
                                                  * @returns All active plan states.
                                                  */
                                                 readonly getAllPlanStates?: () => AsyncOrSync<Record<UID, PlanState>>;
                                                 /**
                                                  * A function that returns the plan state for the plan with the given UID (i.e., the entry for this
                                                  * key in the `activePlans` field of the {@link VivInternalState}).
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * and pulling the desired plan state from there.
                                                  *
                                                  * Note: This function will never be called for a plan whose state has not been initialized yet.
                                                  *
                                                  * @param planID - UID for the plan whose state is to be retrieved.
                                                  * @returns The plan state for the plan with the given UID.
                                                  */
                                                 readonly getPlanState?: (planID: UID) => AsyncOrSync<PlanState>;
                                                 /**
                                                  * A function that updates the plan state for the plan with the given UID (i.e., the entry for this
                                                  * key in the `activePlans` field of the {@link VivInternalState}).
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * updating the applicable plan state, and setting the entire {@link VivInternalState}
                                                  * via {@link HostApplicationAdapter.saveVivInternalState}.
                                                  *
                                                  * @param planID - UID for the plan whose state is to be updated.
                                                  * @param updatedPlanState - The updated plan state to set.
                                                  * @returns Nothing.
                                                  */
                                                 readonly savePlanState?: (planID: UID, updatedPlanState: PlanState) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that deletes the plan state for the plan with the given UID (i.e., deletes this
                                                  * key and its associated entry from the `activePlans` field of the {@link VivInternalState}).
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * deleting the applicable plan state, and setting the entire {@link VivInternalState}
                                                  * via {@link HostApplicationAdapter.saveVivInternalState}.
                                                  *
                                                  * Note: This function will never be called for a plan whose state has not been initialized yet.
                                                  *
                                                  * @param planID - UID for the plan whose state is to be deleted.
                                                  * @returns Nothing.
                                                  */
                                                 readonly deletePlanState?: (planID: UID) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that returns the queued-construct statuses stored in the {@link VivInternalState}.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire {@link VivInternalState}, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * and pulling the queued-construct statuses from there.
                                                  *
                                                  * @returns The queued-construct statuses stored in the {@link VivInternalState}.
                                                  */
                                                 readonly getQueuedConstructStatuses?: () => AsyncOrSync<QueuedConstructStatuses>;
                                                 /**
                                                  * A function that accepts a UID and (potentially updated) status for a queued construct and
                                                  * persists that status in the {@link VivInternalState}.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to retrieving the
                                                  * entire Viv internal state, via {@link HostApplicationAdapter.getVivInternalState},
                                                  * updating the associated queued-construct status, and setting the entire
                                                  * {@link VivInternalState} via {@link HostApplicationAdapter.saveVivInternalState}.
                                                  *
                                                  * @param queuedConstructID - UID for the queued construct whose status will be set.
                                                  * @param queuedConstructStatus - The status to set for the queued construct.
                                                  * @returns Nothing.
                                                  */
                                                 readonly saveQueuedConstructStatus?: (queuedConstructID: UID, queuedConstructStatus: QueuedConstructStatus) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that accepts an entity ID for an action and returns an array containing
                                                  * entity IDs for all causal ancestors of the given one (i.e., its `ancestors` property).
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to the
                                                  * {@link HostApplicationAdapterFastPaths.getEntityProperty} fast path, if supplied,
                                                  * and otherwise to {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * **Important:** Viv assumes that it can freely mutate the furnished data, with any actual
                                                  * updates being persisted via adapter functions or {@link CustomFunction},
                                                  * so be sure to clone as needed.
                                                  *
                                                  * @param actionID - Entity ID for the action whose causal ancestors will be returned.
                                                  * @returns An array containing entity IDs for all the causal ancestors of the given one.
                                                  */
                                                 readonly getActionAncestors?: (actionID: UID) => AsyncOrSync<UID[]>;
                                                 /**
                                                  * A function that accepts an entity ID for an action and returns an array containing entity
                                                  * IDs for all causal descendants of the given one (i.e., its `descendants` property).
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to the
                                                  * {@link HostApplicationAdapterFastPaths.getEntityProperty} fast path, if supplied,
                                                  * and otherwise to {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * **Important:** Viv assumes that it can freely mutate the furnished data, with any actual
                                                  * updates being persisted via adapter functions or {@link CustomFunction},
                                                  * so be sure to clone as needed.
                                                  *
                                                  * @param actionID - Entity ID for the action whose causal descendants will be returned.
                                                  * @returns An array containing entity IDs for all the causal descendants of the given one.
                                                  */
                                                 readonly getActionDescendants?: (actionID: UID) => AsyncOrSync<UID[]>;
                                                 /**
                                                  * A function that accepts an entity ID for a parent action and a child action,
                                                  * and appends the latter to the former's `caused` property.
                                                  *
                                                  * Here, 'parent' and 'child' refer to direct causal relations.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back various other fast paths,
                                                  * to the degree they have been supplied.
                                                  *
                                                  * @param parentID - Entity ID for the parent action whose `caused` property will be updated.
                                                  * @param childID - Entity ID for the child action, which just occurred and is thus not already
                                                  *     in `caused` (i.e., no need to worry about deduplication).
                                                  * @returns Nothing.
                                                  */
                                                 readonly appendActionCaused?: (parentID: UID, childID: UID) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that accepts an entity ID for an ancestor action and a descendant action,
                                                  * and appends the latter to the former's `descendants` property.
                                                  *
                                                  * Here, 'ancestor' and 'descendant' refer to causal relations, either direct or indirect.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back various other fast paths,
                                                  * to the degree they have been supplied.
                                                  *
                                                  * @param ancestorID - Entity ID for the ancestor action whose `descendants` property will be updated.
                                                  * @param descendantID - Entity ID for the descendant action, which just occurred and is thus not
                                                  *     already in `descendants` (i.e., no need to worry about deduplication).
                                                  * @returns Nothing.
                                                  */
                                                 readonly appendActionDescendants?: (ancestorID: UID, descendantID: UID) => AsyncOrSync<void>;
                                                 /**
                                                  * A function that accepts an entity ID for a character and an entity ID for an action and returns
                                                  * the given character's memory of the given action, if they have one, else `null`.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to the
                                                  * {@link HostApplicationAdapterFastPaths.getEntityProperty} fast path, if supplied,
                                                  * and otherwise to {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * **Important:** Viv assumes that it can freely mutate the furnished data, with any actual
                                                  * updates being persisted via adapter functions or {@link CustomFunction},
                                                  * so be sure to clone as needed.
                                                  *
                                                  * @param characterID - Entity ID for the character whose memory will be returned.
                                                  * @param actionID - Entity ID for the action whose associated memory will be returned.
                                                  * @returns The given character's memory of the given action, if they have one, else `null`.
                                                  */
                                                 readonly getCharacterMemory?: (characterID: UID, actionID: UID) => AsyncOrSync<CharacterMemory | null>;
                                                 /**
                                                  * A function that returns the inscriptions for the given item.
                                                  *
                                                  * If this fast path is not supplied, the Viv runtime will fall back to the
                                                  * {@link HostApplicationAdapterFastPaths.getEntityProperty} fast path, if supplied,
                                                  * and otherwise to {@link HostApplicationAdapter.getEntityView}.
                                                  *
                                                  * @param itemID - Entity ID for the item whose inscriptions will be returned.
                                                  * @returns The inscriptions for the given item.
                                                  */
                                                 readonly getItemInscriptions?: (itemID: UID) => AsyncOrSync<UID[]>;
                                             }

                                             /**
                                              * An object specifying observability callbacks.
                                              *
                                              * @category Other
                                              */
                                             export declare interface HostApplicationAdapterObservabilityCallbacks {
                                                 /**
                                                  * If supplied, a callback that will be invoked during action targeting to provide real-time
                                                  * observability into the action-selection process.
                                                  *
                                                  * The callback receives an {@link ActionTargetingEvent} for each action targeting attempt,
                                                  * indicating whether targeting has started, succeeded, or failed. This is useful for monitoring
                                                  * long-running simulations involving many characters and timesteps.
                                                  *
                                                  * **Important:** The runtime does not catch errors thrown by your callback. If the callback throws,
                                                  * the error will propagate through the runtime, in accordance with the broader adapter error contract.
                                                  */
                                                 readonly onActionTargetingEvent?: (event: ActionTargetingEvent) => void;
                                                 /**
                                                  * If supplied, a callback that will be invoked during plan execution to provide real-time
                                                  * observability into plan lifecycle events.
                                                  *
                                                  * The callback receives a {@link PlanExecutionEvent} for each significant plan-execution event,
                                                  * including launch, phase advancement, blocking (on waits or reaction windows), and termination
                                                  * (success or failure).
                                                  *
                                                  * **Important:** The runtime does not catch errors thrown by your callback. If the callback throws,
                                                  * the error will propagate through the runtime, in accordance with the broader adapter error contract.
                                                  */
                                                 readonly onPlanExecutionEvent?: (event: PlanExecutionEvent) => void;
                                             }

                                             /**
                                              * Initializes the Viv runtime for the host application at hand by registering
                                              * its content bundle and Viv adapter.
                                              *
                                              * This function may be called more than once to re-initialize the runtime with a different content
                                              * bundle and/or adapter, with a caveat: re-initialization is only safe when the host application also
                                              * starts fresh, meaning the new adapter's {@link HostApplicationAdapter.getVivInternalState} returns
                                              * `null` and no simulation data from a prior initialization persists. If the content bundle changes
                                              * but old state persists (whether {@link VivInternalState} or the actual simulation data), the runtime
                                              * may become unstable, because components in the old state may reference action names, plan names,
                                              * or other definitions that do not exist in the new bundle. The actual supported use case for
                                              * re-initialization is a context like testing, where each initialization begins with a clean slate.
                                              *
                                              * @category Initialization
                                              * @example
                                              * ```ts
                                              * import { MY_COMPILED_CONTENT_BUNDLE } from "./bundle.json";
                                              * import { MY_ADAPTER } from "./my-adapter";
                                              *
                                              * const initialized = initializeVivRuntime({ contentBundle: MY_COMPILED_CONTENT_BUNDLE, adapter: MY_ADAPTER });
                                              * ```
                                              * @param args - See {@link InitializeVivRuntimeArgs}.
                                              * @returns - See {@link InitializeVivRuntimeResult}.
                                              * @throws If the given content bundle and adapter do not pass validation. In cases of multiple
                                              *     structural issues, only the first will be reported (to keep error messages manageable).
                                              */
                                             export declare function initializeVivRuntime(args: InitializeVivRuntimeArgs): InitializeVivRuntimeResult;

                                             /**
                                              * Arguments associated with initialization of the Viv runtime.
                                              *
                                              * @category Other
                                              * @remarks These are the effective arguments for {@link initializeVivRuntime}.
                                              */
                                             export declare interface InitializeVivRuntimeArgs {
                                                 /**
                                                  * A Viv compiled content bundle, as emitted by the Viv compiler. The type is treated as
                                                  * `unknown` until its shape can be confirmed, but a `ContentBundle` should be supplied.
                                                  */
                                                 readonly contentBundle: unknown;
                                                 /**
                                                  * The Viv adapter for the host application at hand.
                                                  */
                                                 readonly adapter: HostApplicationAdapter;
                                             }

                                             /**
                                              * A success signal, `true`, indicating that the Viv runtime has been initialized successfully.
                                              *
                                              * @category Other
                                              * @remarks This is the return value for {@link initializeVivRuntime}.
                                              */
                                             export declare type InitializeVivRuntimeResult = true;

                                             /**
                                              * A Viv inscription.
                                              *
                                              * This kind of expression causes an item to be inscribed with knowledge about a given
                                              * action. If a character later inspects the item, they will learn about the action.
                                              */
                                             declare interface Inscription extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv inscription.
                                                  */
                                                 readonly type: ExpressionDiscriminator.Inscription;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: InscriptionValue;
                                             }

                                             /**
                                              * The actual expression value for a Viv inscription.
                                              */
                                             declare interface InscriptionValue {
                                                 /**
                                                  * An expression whose evaluation will be used as the item operand in the inscription.
                                                  */
                                                 readonly item: Expression;
                                                 /**
                                                  * An expression whose evaluation will be used as the action operand in the inscription.
                                                  */
                                                 readonly action: Expression;
                                             }

                                             /**
                                              * A Viv inspection, which causes a character to *inspect* an item, which in turn
                                              * may lead them to learn about actions inscribed in the item.
                                              */
                                             declare interface Inspection extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv inspection.
                                                  */
                                                 readonly type: ExpressionDiscriminator.Inspection;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: InspectionValue;
                                             }

                                             /**
                                              * The actual expression value for a Viv inspection.
                                              */
                                             declare interface InspectionValue {
                                                 /**
                                                  * An expression whose evaluation will be used as the character operand in the inspection.
                                                  */
                                                 readonly character: Expression;
                                                 /**
                                                  * An expression whose evaluation will be used as the item operand in the inspection.
                                                  */
                                                 readonly item: Expression;
                                             }

                                             /**
                                              * A Viv integer.
                                              */
                                             declare interface IntField extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv integer.
                                                  */
                                                 readonly type: ExpressionDiscriminator.Int;
                                                 /**
                                                  * The integer literal to which this expression will evaluate.
                                                  */
                                                 readonly value: number;
                                             }

                                             /**
                                              * A read-only entity view for an item in a simulated storyworld.
                                              *
                                              * For details on semantics and constraints, see {@link EntityView}, which this interface extends.
                                              *
                                              * @category Integration
                                              */
                                             export declare interface ItemView extends EntityView {
                                                 /**
                                                  * Discriminator specifying the item entity type.
                                                  */
                                                 readonly entityType: EntityType.Item;
                                                 /**
                                                  * The entity ID for the current location of the item.
                                                  *
                                                  * Viv assumes that each item is in a discrete location at any given point, and that the
                                                  * location is itself an entity for which a {@link LocationView} may be requested.
                                                  */
                                                 readonly location: UID;
                                                 /**
                                                  * Array containing entity IDs for all the actions about which this item inscribes knowledge.
                                                  *
                                                  * Should a character *inspect* the item, via Viv code using the 'inspect' operator, they will
                                                  * thereby learn about all the actions contained in this array. The inscriptions for an item
                                                  * grows via *inscription* events, which occur via Viv code using the 'inscribe' operator.
                                                  */
                                                 readonly inscriptions: UID[];
                                             }

                                             /**
                                              * A Viv list, defined as an ordered array of Viv expressions.
                                              *
                                              * Once evaluated, the result will contain the respective evaluations
                                              * of the expressions, in that same order.
                                              */
                                             declare interface ListField extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv list.
                                                  */
                                                 readonly type: ExpressionDiscriminator.List;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: Expression[];
                                             }

                                             /**
                                              * A Viv local variable.
                                              */
                                             declare interface LocalVariable {
                                                 /**
                                                  * The name of the local variable.
                                                  */
                                                 readonly name: VariableName;
                                                 /**
                                                  * Whether the variable is marked as binding an entity (as opposed to a symbol).
                                                  */
                                                 readonly isEntityVariable: boolean;
                                             }

                                             /**
                                              * A read-only entity view for a location in a simulated storyworld.
                                              *
                                              * For details on semantics and constraints, see {@link EntityView}, which this interface extends.
                                              *
                                              * @category Integration
                                              */
                                             export declare interface LocationView extends EntityView {
                                                 /**
                                                  * Discriminator specifying the location entity type.
                                                  */
                                                 readonly entityType: EntityType.Location;
                                             }

                                             /**
                                              * A Viv loop, allowing for iteration over some iterable value.
                                              */
                                             declare interface Loop extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv loop.
                                                  */
                                                 readonly type: ExpressionDiscriminator.Loop;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: LoopValue;
                                             }

                                             /**
                                              * The actual expression value for a Viv loop.
                                              */
                                             declare interface LoopValue {
                                                 /**
                                                  * An expression that should evaluate to a value that is iterable in JavaScript.
                                                  */
                                                 readonly iterable: Expression;
                                                 /**
                                                  * The local variable to which each member of the iterable is assigned on its
                                                  * respective iteration of the loop.
                                                  */
                                                 readonly variable: LocalVariable;
                                                 /**
                                                  * The body of the loop, structured as an array of expressions that will each be interpreted,
                                                  * in order, on each iteration.
                                                  *
                                                  * These body expressions can reference the loop variable, allowing for Viv code that acts
                                                  * on each member of an iterable.
                                                  */
                                                 readonly body: Expression[];
                                             }

                                             /**
                                              * A Viv membership test, which takes two expressions and evaluates to true if the evaluation
                                              * of the first expression is a member of the evaluation of the second expression.
                                              */
                                             declare interface MembershipTest extends SourceAnnotatedExpression, NegatableExpression {
                                                 /**
                                                  * Discriminator for a Viv membership test.
                                                  */
                                                 readonly type: ExpressionDiscriminator.MembershipTest;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: MembershipTestValue;
                                             }

                                             /**
                                              * The actual expression value for a Viv membership test.
                                              */
                                             declare interface MembershipTestValue {
                                                 /**
                                                  * An expression whose evaluation will be used as the item operand in the membership test.
                                                  */
                                                 readonly item: Expression;
                                                 /**
                                                  * An expression whose evaluation will be used as the collection operand in the membership test.
                                                  */
                                                 readonly collection: Expression;
                                             }

                                             /**
                                              * A Viv memory check.
                                              *
                                              * This kind of expression takes two expressions as operands and evaluates to `True` if
                                              * the evaluation of the first expression is a character, the second expression is an
                                              * action, and the character has a memory of the action.
                                              */
                                             declare interface MemoryCheck extends SourceAnnotatedExpression, NegatableExpression {
                                                 /**
                                                  * Discriminator for a Viv memory check.
                                                  */
                                                 readonly type: ExpressionDiscriminator.MemoryCheck;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: MemoryCheckValue;
                                             }

                                             /**
                                              * The actual expression value for a Viv memory check.
                                              */
                                             declare interface MemoryCheckValue {
                                                 /**
                                                  * An expression whose evaluation will be used as the character operand in the memory check.
                                                  */
                                                 readonly character: Expression;
                                                 /**
                                                  * An expression whose evaluation will be used as the action operand in the memory check.
                                                  */
                                                 readonly action: Expression;
                                             }

                                             /**
                                              * Mixin for expression types that may be negated.
                                              */
                                             declare interface NegatableExpression {
                                                 /**
                                                  * Whether to negate the result of the expression.
                                                  */
                                                 readonly negated: boolean;
                                             }

                                             /**
                                              * Handle on the Node.js symbol for customizing `util.inspect` output.
                                              *
                                              * This is stored as a constant so that TypeScript can track it as a property key.
                                              */
                                             declare const NODE_INSPECT_SYMBOL: unique symbol;

                                             /**
                                              * A Viv null value.
                                              */
                                             declare interface NullField extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv null value.
                                                  */
                                                 readonly type: ExpressionDiscriminator.NullType;
                                                 /**
                                                  * JavaScript's `null`, to which the expression always evaluates.
                                                  */
                                                 readonly value: null;
                                             }

                                             /**
                                              * A Viv object literal, which maps keys (string literals) to Viv expressions.
                                              *
                                              * Once evaluated, the result will map those same keys to the respective
                                              * evaluations of the Viv expressions.
                                              */
                                             declare interface ObjectField extends SourceAnnotatedExpression {
                                                 /**
                                                  * Discriminator for a Viv object literal.
                                                  */
                                                 readonly type: ExpressionDiscriminator.Object;
                                                 /**
                                                  * The actual expression value.
                                                  */
                                                 readonly value: Record<string, Expression>;
                                             }

                                             /**
                                              * Emitted when plan execution blocks on a reaction window, waiting for queued constructs
                                              * to resolve according to the window's operator.
                                              *
                                              * If the window becomes unsatisfiable (e.g., all constructs fail under an `any` operator),
                                              * the plan will fail and a {@link PlanFailedEvent} will be emitted.
                                              *
                                              * @category Debugging
                                              */
                                             export declare interface PlanBlockedOnReactionWindowEvent extends PlanExecutionEventBase {
                                                 /**
                                                  * Discriminator for a blocked-on-reaction-window event.
                                                  */
                                                 readonly type: PlanExecutionEventType.BlockedOnReactionWindow;
                                                 /**
                                                  * The name of the phase in which the plan is blocked.
                                                  */
                                                 readonly phase: PlanPhaseName;
                                                 /**
                                                  * The operator governing the reaction window.
                                                  */
                                                 readonly operator: PlanPhaseReactionWindowOperator;
                                                 /**
                                                  * UIDs for the constructs queued during this reaction window, over which the operator holds.
                                                  */
                                                 readonly queuedConstructs: readonly UID[];
                                             }

                                             /**
                                              * Emitted when plan execution blocks on a wait instruction, pausing until a deadline
                                              * elapses or optional resume conditions are satisfied.
                                              *
                                              * @category Debugging
                                              */
                                             export declare interface PlanBlockedOnWaitEvent extends PlanExecutionEventBase {
                                                 /**
                                                  * Discriminator for a blocked-on-wait event.
                                                  */
                                                 readonly type: PlanExecutionEventType.BlockedOnWait;
                                                 /**
                                                  * The name of the phase at hand (in which the plan is blocked).
                                                  */
                                                 readonly phase: PlanPhaseName;
                                                 /**
                                                  * The diegetic timestamp at which the wait will expire, allowing execution to resume.
                                                  */
                                                 readonly deadline: DiegeticTimestamp;
                                             }

                                             /**
                                              * The definition for a plan, which an author defines to orchestrate complex action sequences
                                              * that may play out over extended periods of story time.
                                              *
                                              * A plan is composed primarily by an ordered set of {@link PlanPhase}, each of which centers on
                                              * a *tape* of {@link PlanInstruction}. The plan executor executes a phase by stepping
                                              * a program counter ({@link PlanInstructionAddress}) through the phase tape, which specifies control flow
                                              * along with instructions for queueing the material that makes up the plan.
                                              */
                                             declare interface PlanDefinition {
                                                 /**
                                                  * Discriminator for the plan construct type.
                                                  */
                                                 readonly type: ConstructDiscriminator.Plan;
                                                 /**
                                                  * The (unique) name of the plan.
                                                  */
                                                 readonly name: PlanName;
                                                 /**
                                                  * Mapping from the names of the roles associated with this plan to their respective role definitions.
                                                  *
                                                  * Note that the roles appear in the order in which the author defined them.
                                                  */
                                                 readonly roles: Record<RoleName, RoleDefinition>;
                                                 /**
                                                  * The names of the roles constituting the roots of the trees composing role-dependency
                                                  * forest for this plan definition.
                                                  *
                                                  * The roots are given in the order by which role casting will proceed.
                                                  */
                                                 readonly roleForestRoots: RoleName[];
                                                 /**
                                                  * Conditions for the plan, grouped by role name (with the special global-conditions key).
                                                  *
                                                  * A condition is an expression that must hold (i.e., evaluate to a truthy value) in order
                                                  * for the plan to be launched.
                                                  */
                                                 readonly conditions: ConstructConditions;
                                                 /**
                                                  * A mapping from phase name to phase definition, for all phases structuring the plan.
                                                  *
                                                  * Note that the individual phases each point to the next phase, so we don't need to
                                                  * maintain order here.
                                                  */
                                                 readonly phases: Record<PlanPhaseName, PlanPhase>;
                                                 /**
                                                  * The name of the initial phase in the plan.
                                                  *
                                                  * Plan execution will always begin in this phase.
                                                  */
                                                 readonly initialPhase: PlanPhaseName;
                                             }

                                             /**
                                              * A plan-execution event, as issued to the {@link HostApplicationAdapterObservabilityCallbacks.onPlanExecutionEvent}
                                              * observability callback.
                                              *
                                              * @category Debugging
                                              */
                                             export declare type PlanExecutionEvent = PlanLaunchedEvent | PlanPhaseAdvancedEvent | PlanBlockedOnWaitEvent | PlanBlockedOnReactionWindowEvent | PlanSucceededEvent | PlanFailedEvent;

                                             /**
                                              * Base shape shared by all plan-execution events.
                                              *
                                              * @category Debugging
                                              */
                                             declare interface PlanExecutionEventBase {
                                                 /**
                                                  * The unique identifier for the plan state associated with this event.
                                                  */
                                                 readonly planID: UID;
                                                 /**
                                                  * The name of the plan, as defined in the content bundle.
                                                  */
                                                 readonly plan: PlanName;
                                             }

                                             /**
                                              * Enum specifying the discriminators for plan-execution events.
                                              *
                                              * @category Debugging
                                              */
                                             export declare enum PlanExecutionEventType {
                                                 /**
                                                  * The plan was launched, i.e., role casting succeeded and execution has begun.
                                                  */
                                                 Launched = "launched",
                                                 /**
                                                  * Plan execution advanced into a new phase.
                                                  */
                                                 PhaseAdvanced = "phaseAdvanced",
                                                 /**
                                                  * Plan execution is blocked on a wait instruction.
                                                  */
                                                 BlockedOnWait = "blockedOnWait",
                                                 /**
                                                  * Plan execution is blocked on a reaction window.
                                                  */
                                                 BlockedOnReactionWindow = "blockedOnReactionWindow",
                                                 /**
                                                  * The plan completed successfully.
                                                  */
                                                 Succeeded = "succeeded",
                                                 /**
                                                  * The plan failed.
                                                  */
                                                 Failed = "failed"
                                             }

                                             /**
                                              * Emitted when a plan fails, either due to a `fail` instruction or an unsatisfiable reaction window.
                                              *
                                              * @category Debugging
                                              */
                                             export declare interface PlanFailedEvent extends PlanExecutionEventBase {
                                                 /**
                                                  * Discriminator for a plan-failed event.
                                                  */
                                                 readonly type: PlanExecutionEventType.Failed;
                                                 /**
                                                  * The name of the phase in which the plan failed.
                                                  */
                                                 readonly phase: PlanPhaseName;
                                             }

                                             /**
                                              * A compiled instruction in a plan tape.
                                              */
                                             declare type PlanInstruction = PlanInstructionAdvance | PlanInstructionFail | PlanInstructionJump | PlanInstructionJumpIfFalse | PlanInstructionLoopInit | PlanInstructionLoopNext | PlanInstructionReactionQueue | PlanInstructionReactionWindowClose | PlanInstructionReactionWindowOpen | PlanInstructionSucceed | PlanInstructionWaitEnd | PlanInstructionWaitStart;

                                             /**
                                              * An address for an {@link PlanInstruction} in a {@link PlanPhase},
                                              * which is really just as an index into the phase's `tape` array property.
                                              *
                                              * As plan execution proceeds, the executor maintains the address for the current
                                              * instruction as a program counter.
                                              */
                                             declare type PlanInstructionAddress = number;

                                             /**
                                              * A plan instruction that advances to the next plan phase, skipping any remaining
                                              * instructions in the current phase.
                                              */
                                             declare interface PlanInstructionAdvance {
                                                 /**
                                                  * Discriminator for an advance plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.Advance;
                                             }

                                             /**
                                              * Enum specifying the discriminators for all Viv {@link PlanInstruction} variants.
                                              */
                                             declare enum PlanInstructionDiscriminator {
                                                 /**
                                                  * Advance to the next phase in the plan.
                                                  */
                                                 Advance = "advance",
                                                 /**
                                                  * Resolve the plan with a final failure status.
                                                  */
                                                 Fail = "fail",
                                                 /**
                                                  * Jump unconditionally to a new plan instruction.
                                                  */
                                                 Jump = "jump",
                                                 /**
                                                  * Jump to a new plan instruction if a condition does not hold.
                                                  */
                                                 JumpIfFalse = "jumpIfFalse",
                                                 /**
                                                  * Initialize a `foreach`-style loop frame.
                                                  */
                                                 LoopInit = "loopInit",
                                                 /**
                                                  * Advance an active loop frame to the next iteration, or exit the loop if its iterations have been exhausted.
                                                  */
                                                 LoopNext = "loopNext",
                                                 /**
                                                  * Queue a single {@link ReactionQueue}.
                                                  */
                                                 ReactionQueue = "reactionQueue",
                                                 /**
                                                  * Open a new reaction window.
                                                  */
                                                 ReactionWindowOpen = "reactionWindowOpen",
                                                 /**
                                                  * Close the active reaction window, and start trying to resolve the window according to its operator.
                                                  */
                                                 ReactionWindowClose = "reactionWindowClose",
                                                 /**
                                                  * Resolve the plan with a final success status.
                                                  */
                                                 Succeed = "succeed",
                                                 /**
                                                  * Resume execution of the plan following a pause imposed by a wait-start instruction.
                                                  */
                                                 WaitEnd = "waitEnd",
                                                 /**
                                                  * Commence a pause on execution of the plan that will persist until a timeout occurs (diegetic duration),
                                                  * or until an optional set of author-supplied conditions hold.
                                                  */
                                                 WaitStart = "waitStart"
                                             }

                                             /**
                                              * A plan instruction that resolves the plan with a final failure status.
                                              */
                                             declare interface PlanInstructionFail {
                                                 /**
                                                  * Discriminator for a fail plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.Fail;
                                             }

                                             /**
                                              * A plan instruction that causes an unconditional jump to a different position
                                              * in the phase's instruction tape.
                                              */
                                             declare interface PlanInstructionJump {
                                                 /**
                                                  * Discriminator for a jump plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.Jump;
                                                 /**
                                                  * The instruction address to which execution will jump unconditionally.
                                                  *
                                                  * Jumps can only occur within the tape for a given phase, which is why an address alone is sufficient here.
                                                  */
                                                 readonly target: PlanInstructionAddress;
                                             }

                                             /**
                                              * A plan instruction that specifies a conditional jump to a different position in the phase's instruction tape.
                                              *
                                              * If the condition does not hold, the plan executor will proceed to the next instruction
                                              * (i.e., increment program counter by one). This enables conditionals in plan bodies.
                                              */
                                             declare interface PlanInstructionJumpIfFalse {
                                                 /**
                                                  * Discriminator for a jump-if-false plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.JumpIfFalse;
                                                 /**
                                                  * The condition to evaluate.
                                                  *
                                                  * If it does *not* hold, execution will proceed to the instruction address specified in the `target`
                                                  * field, else it will proceed to the next instruction (by incrementing the counter by one).
                                                  */
                                                 readonly condition: Expression;
                                                 /**
                                                  * The instruction address to which execution will jump if the instruction `condition` does *not* hold.
                                                  */
                                                 readonly target: PlanInstructionAddress;
                                             }

                                             /**
                                              * A plan instruction that initializes a loop frame and pushes it onto the loop stack.
                                              */
                                             declare interface PlanInstructionLoopInit {
                                                 /**
                                                  * Discriminator for a loop-init plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.LoopInit;
                                                 /**
                                                  * The expression yielding the iterable to loop over.
                                                  *
                                                  * This will be evaluated once, at the time the loop is initialized. For example, a loop over
                                                  * `@foo.friends` with a loop-body instruction causing a one-year wait after each iteration
                                                  * would still be operating over the friends that `@foo` had at the time the loop was entered
                                                  * (years ago, in diegetic terms).
                                                  */
                                                 readonly iterable: Expression;
                                                 /**
                                                  * The local variable to bind on each iteration, which the plan executor stores in the loop
                                                  * frame that will be created when executing this instruction.
                                                  */
                                                 readonly variable: LocalVariable;
                                             }

                                             /**
                                              * A plan instruction that advances the active loop frame by one iteration, or else exits
                                              * the loop if the iterable has been exhausted.
                                              *
                                              * If there is a next element in the iterable, the plan executor will bind it to the loop variable and
                                              * fall through to the next instruction (i.e., increment by the program counter by one). If the iterable
                                              * has been exhausted, the executor will jump to the instruction address specified by `exitTarget`.
                                              */
                                             declare interface PlanInstructionLoopNext {
                                                 /**
                                                  * Discriminator for a loop-next plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.LoopNext;
                                                 /**
                                                  * The instruction address to jump to when the loop iterable is exhausted.
                                                  *
                                                  * If the iterable is empty from the start, the loop will immediately exit by virtue of this instruction.
                                                  */
                                                 readonly exitTarget: PlanInstructionAddress;
                                             }

                                             /**
                                              * A plan instruction that causes queueing of an action, plan, or selector according
                                              * to a specified {@link Reaction}.
                                              */
                                             declare interface PlanInstructionReactionQueue {
                                                 /**
                                                  * Discriminator for a reaction-queue plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.ReactionQueue;
                                                 /**
                                                  * The reaction declaration.
                                                  */
                                                 readonly reaction: Reaction;
                                             }

                                             /**
                                              * A plan instruction that closes the active reaction window, pending resolution that is
                                              * governed by a specified {@link PlanPhaseReactionWindowOperator}.
                                              */
                                             declare interface PlanInstructionReactionWindowClose {
                                                 /**
                                                  * Discriminator for a plan instruction that closes the active reaction window.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.ReactionWindowClose;
                                                 /**
                                                  * The logical operator that will govern resolution of the reaction window.
                                                  */
                                                 readonly operator: PlanPhaseReactionWindowOperator;
                                             }

                                             /**
                                              * A plan instruction that opens a new reaction window whose resolution will be governed by a
                                              * {@link PlanPhaseReactionWindowOperator} specified in the corresponding
                                              * {@link PlanInstructionReactionWindowClose} instruction.
                                              */
                                             declare interface PlanInstructionReactionWindowOpen {
                                                 /**
                                                  * Discriminator for a plan instruction that opens a reaction window.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.ReactionWindowOpen;
                                             }

                                             /**
                                              * A plan instruction that resolves the plan with a final success status.
                                              */
                                             declare interface PlanInstructionSucceed {
                                                 /**
                                                  * Discriminator for a succeed plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.Succeed;
                                             }

                                             /**
                                              * A plan instruction that resumes plan execution following a pause imposed by a
                                              * {@link PlanInstructionWaitStart} instruction.
                                              */
                                             declare interface PlanInstructionWaitEnd {
                                                 /**
                                                  * Discriminator for a wait-end plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.WaitEnd;
                                                 /**
                                                  * If specified, a set of expressions that must hold to resume plan execution prior to the timeout elapsing.
                                                  */
                                                 readonly resumeConditions: Expression[] | null;
                                             }

                                             /**
                                              * A plan instruction that commences a pause on plan execution that will persist
                                              * until a timeout elapses or a set of conditions hold.
                                              */
                                             declare interface PlanInstructionWaitStart {
                                                 /**
                                                  * Discriminator for a wait-start plan instruction.
                                                  */
                                                 readonly type: PlanInstructionDiscriminator.WaitStart;
                                                 /**
                                                  * A timeout, expressed as the maximum period of story time to wait counting from the time
                                                  * at which this instruction was executed.
                                                  */
                                                 readonly timeout: TimeDelta;
                                             }

                                             /**
                                              * Emitted when a plan is launched, i.e., when role casting succeeds and plan execution begins.
                                              *
                                              * Note: A {@link PlanPhaseAdvancedEvent} for the initial phase will immediately follow this event.
                                              *
                                              * @category Debugging
                                              */
                                             export declare interface PlanLaunchedEvent extends PlanExecutionEventBase {
                                                 /**
                                                  * Discriminator for a plan-launched event.
                                                  */
                                                 readonly type: PlanExecutionEventType.Launched;
                                             }

                                             /**
                                              * A loop frame in the loop stack for an active plan.
                                              *
                                              * This stores data about a loop that is in progress.
                                              */
                                             declare interface PlanLoopFrame {
                                                 /**
                                                  * An array storing the evaluated loop iterable, which will be iterated over one element
                                                  * at a time, with the element at hand being bound to `variable`.
                                                  *
                                                  * Note that the iterable is evaluated only once, upon {@link PlanInstructionLoopInit},
                                                  * and that it is stored in a {@link dehydrateExpressionValue} state.
                                                  */
                                                 readonly iterable: ExpressionValue[];
                                                 /**
                                                  * The local variable to which each member of the iterable is assigned on its respective
                                                  * iteration of the loop.
                                                  */
                                                 readonly variable: LocalVariable;
                                                 /**
                                                  * The index in `iterable` to be used to retrieve the loop-variable binding for the next iteration.
                                                  *
                                                  * This is incremented by one at the end of each iteration, and the loop
                                                  * {@link PlanInstructionLoopNext} once this matches the length of `iterable`.
                                                  */
                                                 iterationIndex: number;
                                             }

                                             /**
                                              * A (unique) name for a plan.
                                              *
                                              * @category Other
                                              */
                                             export declare type PlanName = string;

                                             /**
                                              * A phase in a plan, which is structured as a tape of instructions for which execution can
                                              * be arbitrary paused according to the author-defined control flow.
                                              *
                                              * For instance, an author can specify that the plan will not resume until some period of story time
                                              * has elapsed, or until one of the reactions in a group has been performed, and so forth.
                                              */
                                             declare interface PlanPhase {
                                                 /**
                                                  * The name for the phase, guaranteed to be unique (only) within the enclosing plan.
                                                  */
                                                 readonly name: PlanPhaseName;
                                                 /**
                                                  * The name of the next phase in the plan, if any, else `null` if it's the last phase in the plan.
                                                  *
                                                  * Completion of a final phase causes the plan to resolve with a final success status.
                                                  */
                                                 readonly next: PlanPhaseName | null;
                                                 /**
                                                  * An array containing the compiled instruction tape for this phase, such that each array index serves
                                                  * as an {@link PlanInstructionAddress}.
                                                  *
                                                  * If execution reaches the end of the tape, execution proceeds to the next phase in the plan,
                                                  * if there is one; otherwise, the plan succeeds.
                                                  */
                                                 readonly tape: PlanInstruction[];
                                             }

                                             /**
                                              * Emitted when plan execution advances into a new phase.
                                              *
                                              * @category Debugging
                                              */
                                             export declare interface PlanPhaseAdvancedEvent extends PlanExecutionEventBase {
                                                 /**
                                                  * Discriminator for a phase-advanced event.
                                                  */
                                                 readonly type: PlanExecutionEventType.PhaseAdvanced;
                                                 /**
                                                  * The name of the phase into which execution is advancing.
                                                  */
                                                 readonly phase: PlanPhaseName;
                                             }

                                             /**
                                              * A name for a plan phase, guaranteed to be unique only within the enclosing plan.
                                              */
                                             declare type PlanPhaseName = string;

                                             /**
                                              * Enum containing the valid operators for reaction windows.
                                              *
                                              * When a reaction window is active during execution of a plan phase, all reactions that are queued during
                                              * the window are tracked. Once the end of the window is reached, execution focuses on resolving the window
                                              * according to its operator. Depending on the operator and the reaction outcomes, this may require all the
                                              * queued reactions to be resolved.
                                              *
                                              * Note: The DSL allows for authors to specify an `untracked` operator, but this is equivalent to declaring
                                              * a sequence of bare reactions, and in fact this is how an `untracked` window is compiled. As such, the
                                              * operator never makes it into the compiled content bundle, hence it not appearing here.
                                              */
                                             export declare enum PlanPhaseReactionWindowOperator {
                                                 /**
                                                  * All the reactions must be performed/launched in order for plan execution to proceed. Note that
                                                  * plan execution will always proceed if no reactions are queued during the reaction window.
                                                  */
                                                 All = "all",
                                                 /**
                                                  * At least one of the reactions must be performed/launched in order for plan execution to proceed. Note
                                                  * that the plan will always fail if no reactions are queued during the reaction window.
                                                  */
                                                 Any = "any"
                                             }

                                             /**
                                              * An array storing queued plans (and queued plan selectors), in insertion order (FIFO).
                                              *
                                              * @category Other
                                              */
                                             export declare type PlanQueue = (QueuedPlan | QueuedPlanSelector)[];

                                             /**
                                              * The definition for a plan selector, which groups plans actions (and potentially other plan selectors)
                                              * under a targeting policy and succeeds upon successful targeting of one of the candidates.
                                              */
                                             declare interface PlanSelectorDefinition extends SelectorDefinitionBase {
                                                 /**
                                                  * Discriminator for the plan-selector construct type.
                                                  */
                                                 readonly type: ConstructDiscriminator.PlanSelector;
                                             }

                                             /**
                                              * State for an active plan, meaning what that has been launched and is still underway.
                                              *
                                              * Execution of the plan will continue until a success or failure point is reached.
                                              *
                                              * *This is an internal type that is not part of the stable API surface. Its shape may change in any release.*
                                              *
                                              * @internal
                                              * @category Other
                                              */
                                             export declare interface PlanState {
                                                 /**
                                                  * UID for the launched plan.
                                                  */
                                                 readonly id: UID;
                                                 /**
                                                  * The name of the plan at hand.
                                                  */
                                                 readonly planName: PlanName;
                                                 /**
                                                  * The final bindings that were constructed for the plan during role casting.
                                                  *
                                                  * Bindings map roles to the respective entities (or symbols) that were cast in those roles.
                                                  */
                                                 readonly bindings: RoleBindings;
                                                 /**
                                                  * The (dehydrated) evaluation context associated with the launched plan.
                                                  */
                                                 readonly evaluationContext: EvaluationContext;
                                                 /**
                                                  * The name of the current plan phase.
                                                  *
                                                  * Always initializes to the name of the first phase in the plan.
                                                  */
                                                 currentPhase: PlanPhaseName;
                                                 /**
                                                  * A program counter indicating the address of the current
                                                  * plan instruction, which is concretely an index into the `tape`
                                                  * array of the current plan phase.
                                                  *
                                                  * Always initializes to `0`.
                                                  */
                                                 programCounter: PlanInstructionAddress;
                                                 /**
                                                  * The current stack of loop frames, which we process using a LIFO policy.
                                                  *
                                                  * This is an empty array when there are no active loops.
                                                  */
                                                 loopStack: PlanLoopFrame[];
                                                 /**
                                                  * UIDs for all queued constructs that have been queued during the active reaction window,
                                                  * if there is one, else `null`.
                                                  *
                                                  * Following the opening of a reaction window, all reactions
                                                  * queued during the window are tracked. At the close of
                                                  * the window, depending on the operator and the {@link QueuedConstructStatus} of these queued
                                                  * constructs, either the plan will fail entirely or plan execution will advance to the next instruction.
                                                  */
                                                 reactionWindowQueuedConstructs: UID[] | null;
                                                 /**
                                                  * The deadline for an active wait instruction, if any, else `null`.
                                                  *
                                                  * This is the diegetic timestamp at which the wait will expire, though there may be associated
                                                  * conditions that could cause an earlier progression to the next instruction.
                                                  */
                                                 waitDeadline: DiegeticTimestamp | null;
                                                 /**
                                                  * Whether plan execution has terminated, regardless of the reason.
                                                  */
                                                 resolved: boolean;
                                                 /**
                                                  * When applicable, the original queued plan (or plan selector) that resulted in this plan being launched.
                                                  *
                                                  * This field is only present when the original queued plan has repeat logic. In such cases, the plan
                                                  * might be re-queued upon successful execution, and as such we need to keep the original queued plan
                                                  * around so that we can make a copy later on.
                                                  *
                                                  * Note that this situation differs considerably from action re-queueing: because an action is performed
                                                  * instantaneously, we will always still have the queued action handy at the time it's successfully
                                                  * executed. In the case of a plan, however, arbitrary amounts of time can pass between launching
                                                  * a queued plan and its being successfully performed.
                                                  */
                                                 sourceQueuedPlan?: QueuedPlan | QueuedPlanSelector;
                                             }

                                             /**
                                              * Emitted when a plan completes successfully.
                                              *
                                              * @category Debugging
                                              */
                                             export declare interface PlanSucceededEvent extends PlanExecutionEventBase {
                                                 /**
                                                  * Discriminator for a plan-succeeded event.
                                                  */
                                                 readonly type: PlanExecutionEventType.Succeeded;
                                                 /**
                                                  * The name of the phase in which the plan succeeded.
                                                  */
                                                 readonly phase: PlanPhaseName;
                                             }

                                             /**
                                              * Precast bindings for the targeting of some construct, as in a reaction or a sifting expression.
                                              */
                                             declare interface PrecastBindings {
                                                 /**
                                                  * Whether the precast bindings are marked partial, meaning additional required role
                                                  * slots will need to be cast.
                                                  *
                                                  * The compiler will verify that all required slots appear to be precast, but we will
                                                  * also confirm this at runtime.
                                                  */
                                                 readonly partial: boolean;
                                                 /**
                                                  * A mapping from role name to an expression that will evaluate to precast bindings for that role.
                                                  */
                                                 readonly roles: Record<RoleName, Expression>;
                                             }

                                             /**
                                              * A query used to search for actions in a character's memories or in the chronicle.
                                              */
                                             declare interface QueryDefinition {
                                                 /**
                                                  * Discriminator for the query construct type.
                                                  */
                                                 readonly type: ConstructDiscriminator.Query;
                                                 /**
                                                  * The (unique) name of the query.
                                                  */
                                                 readonly name: QueryName;
                                                 /**
                                                  * Mapping from the names of the roles associated with this action to their respective role definitions.
                                                  *
                                                  * Note that a query may have zero roles, in which case this is empty. Also,
                                                  * the roles appear in the order in which the author defined them.
                                                  */
                                                 readonly roles: Record<RoleName, RoleDefinition>;
                                                 /**
                                                  * The names of the roles constituting the roots of the trees composing role-dependency
                                                  * forest for this query definition.
                                                  *
                                                  * The roots are given in the order by which role casting will proceed.
                                                  */
                                                 readonly roleForestRoots: RoleName[];
                                                 /**
                                                  * Conditions for the query, grouped by role name (with the special global-conditions key).
                                                  *
                                                  * A condition is an expression that must hold (i.e., evaluate to a truthy value) in order
                                                  * for a query to match.
                                                  */
                                                 readonly conditions: ConstructConditions;
                                                 /**
                                                  * If specified, a component specifying permissible action names for matches to the query.
                                                  */
                                                 readonly actionName: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible causal ancestors for matches to the query.
                                                  */
                                                 readonly ancestors: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible causal descendants for matches to the query.
                                                  */
                                                 readonly descendants: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying a permissible importance range for matches to the query.
                                                  */
                                                 readonly importance: QueryNumericRange | null;
                                                 /**
                                                  * If specified, a component specifying permissible tags for matches to the query.
                                                  */
                                                 readonly tags: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying a permissible salience range for matches to the query.
                                                  *
                                                  * If this query is targeted with the chronicle as a search domain, an error will be thrown,
                                                  * since the query applies to character memories.
                                                  */
                                                 readonly salience: QueryNumericRange | null;
                                                 /**
                                                  * If specified, a component specifying permissible associations for matches to the query.
                                                  *
                                                  * If this query is targeted with the chronicle as a search domain, an error will be thrown,
                                                  * since the query applies to character memories.
                                                  */
                                                 readonly associations: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible locations for matches to the query.
                                                  */
                                                 readonly location: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible performance times for matches to the query.
                                                  */
                                                 readonly time: TemporalConstraint[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible initiator-role bindings for matches to the query.
                                                  */
                                                 readonly initiator: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible partner-role bindings for matches to the query.
                                                  */
                                                 readonly partners: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible recipient-role bindings for matches to the query.
                                                  */
                                                 readonly recipients: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible bystander-role bindings for matches to the query.
                                                  */
                                                 readonly bystanders: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible active-role bindings for matches to the query.
                                                  */
                                                 readonly active: SetPredicate[] | null;
                                                 /**
                                                  * If specified, a component specifying permissible present-role bindings for matches to the query.
                                                  */
                                                 readonly present: SetPredicate[] | null;
                                             }

                                             /**
                                              * A unique name for a query.
                                              *
                                              * @category Other
                                              */
                                             export declare type QueryName = string;

                                             /**
                                              * A permissible numeric range used in a query.
                                              */
                                             declare interface QueryNumericRange {
                                                 /**
                                                  * The lower bound of the range, if there is one, else `null`.
                                                  */
                                                 readonly lower: QueryNumericRangeBound | null;
                                                 /**
                                                  * The upper bound of the range, if there is one, else `null`.
                                                  */
                                                 readonly upper: QueryNumericRangeBound | null;
                                             }

                                             /**
                                              * A bound on a permissible numeric range used in a query.
                                              */
                                             declare interface QueryNumericRangeBound {
                                                 /**
                                                  * The number at this bound of a range.
                                                  */
                                                 readonly value: IntField | FloatField | Enum;
                                                 /**
                                                  * Whether this bound is inclusive.
                                                  */
                                                 readonly inclusive: boolean;
                                             }

                                             /**
                                              * An action that is queued for potential future performance by a given character.
                                              *
                                              * Concretely, an action is queued when a reaction declaration for another action (or a plan) is acted
                                              * upon. Queueing entails insertion into the prospective initiator's action queue, and ultimately there
                                              * is no guarantee the action will actually be performed, since the author can constrain performance in
                                              * various ways, including via expiration and abandonment criteria.
                                              */
                                             export declare interface QueuedAction extends QueuedActionBase {
                                                 /**
                                                  * Discriminator for a queued action.
                                                  */
                                                 readonly type: QueuedConstructDiscriminator.Action;
                                                 /**
                                                  * The name of the queued action.
                                                  */
                                                 readonly constructName: ActionName;
                                             }

                                             /**
                                              * Base data shared by queued actions and queued action selectors.
                                              */
                                             declare interface QueuedActionBase extends QueuedConstructBase {
                                                 /**
                                                  * Entity ID for the prospective initiator of the action (selector).
                                                  */
                                                 readonly initiator: UID;
                                                 /**
                                                  * A numeric priority value that governs insertion into the initiator's queue. If the queued action
                                                  * is also marked `urgent`, this will be used as a secondary ordering key inside the urgency bucket.
                                                  * Higher values indicating a higher priority, and thus an earlier position in the queue.
                                                  */
                                                 readonly priority: number;
                                                 /**
                                                  * If present, predicates that will constrain where the eventual action may be performed.
                                                  */
                                                 location?: SetPredicate[];
                                                 /**
                                                  * Temporal constraints on when exactly the eventual action may be performed. The constraints may specify a
                                                  * time-of-day window and/or a point-in-time window, with story time being the domain in each case. Note
                                                  * that the interpreter is tasked with grounding constraints into actual story time, as needed, by making
                                                  * use of the host application's Viv adapter.
                                                  */
                                                 time?: QueuedActionTemporalConstraints;
                                             }

                                             /**
                                              * An action selector that is queued for future consideration on behalf of a given character.
                                              *
                                              * Concretely, an action selector is queued when a reaction declaration for another action (or a plan)
                                              * is acted upon. Queueing entails insertion into the prospective initiator's action queue. When the
                                              * selector is considered, it will succeed (and be dequeued) if it causes one of its associated actions
                                              * to successfully be performed. Ultimately there is no guarantee that any action will actually be performed
                                              * by virtue of the queued action selector, since the author can constrain performance in various ways,
                                              * including via expiration and abandonment criteria.
                                              */
                                             export declare interface QueuedActionSelector extends QueuedActionBase {
                                                 /**
                                                  * Discriminator for a queued action selector.
                                                  */
                                                 readonly type: QueuedConstructDiscriminator.ActionSelector;
                                                 /**
                                                  * The name of the queued action selector.
                                                  */
                                                 readonly constructName: SelectorName;
                                             }

                                             /**
                                              * Temporal constraints on a queued action (selector) that have already been grounded to story time
                                              * in the running instance of the host application at hand.
                                              */
                                             declare interface QueuedActionTemporalConstraints {
                                                 /**
                                                  * A temporal constraint specifying an acceptable range that begins and/or ends with a certain
                                                  * point in story time, such that the eventual action may only be performed during that window.
                                                  */
                                                 readonly timeFrame: QueuedActionTemporalConstraintTimeFrame | null;
                                                 /**
                                                  * A temporal constraint specifying an acceptable range that begins and/or ends with a certain
                                                  * time of day, such that the eventual action may only be performed during that window. There's
                                                  * no need to ground these expressions in story time, so we can reuse the content types here.
                                                  */
                                                 readonly timeOfDay: QueuedActionTemporalConstraintTimeOfDay | null;
                                             }

                                             /**
                                              * A temporal constraint on a queued action (selector) specifying an acceptable range that begins
                                              * and/or ends with a certain point in story time, such that the eventual action may only be
                                              * performed during that window.
                                              */
                                             declare interface QueuedActionTemporalConstraintTimeFrame {
                                                 /**
                                                  * If present, the earliest point in story time at which the eventual action may be performed.
                                                  */
                                                 readonly open: DiegeticTimestamp | null;
                                                 /**
                                                  * If present, the latest point in story time at which the eventual action may be performed. Should
                                                  * this timestamp be eclipsed, the planner will automatically dequeue the action.
                                                  */
                                                 readonly close: DiegeticTimestamp | null;
                                             }

                                             /**
                                              * A temporal constraint on a queued action (selector) specifying an acceptable range that begins
                                              * and/or ends with a certain  point in story time, such that the eventual action may only be
                                              * performed during that window.
                                              */
                                             declare interface QueuedActionTemporalConstraintTimeOfDay {
                                                 /**
                                                  * If present, the earliest time of day at which the queued action may be performed.
                                                  */
                                                 readonly open: TimeOfDay | null;
                                                 /**
                                                  * If present, the latest time of day at which the queued action may be performed.
                                                  */
                                                 readonly close: TimeOfDay | null;
                                             }

                                             /**
                                              * Abandonment conditions for a queued construct.
                                              *
                                              * If these all hold at any point at which the queued construct is being targeted, it will be dequeued.
                                              */
                                             declare interface QueuedConstructAbandonmentConditions {
                                                 /**
                                                  * An array of Viv expressions such that, if all of them hold (i.e. evaluate to
                                                  * truthy values), the queued construct will be abandoned (i.e., dequeued).
                                                  */
                                                 readonly conditions: Expression[];
                                                 /**
                                                  * The evaluation context to use when evaluating the abandonment conditions.
                                                  *
                                                  * At the time a reaction declaration was executed to queue the construct, this will have been dehydrated,
                                                  * meaning all entity data will have been converted into entity IDs. This allows the planner to pull the
                                                  * latest entity state at the time of condition evaluation. Note that we have to attach this context here
                                                  * in order to preserve any local variables that may be pertinent, which is a common case that results
                                                  * from an author queueing reactions within a loop. If we were to instead store the entity ID for
                                                  * the cause of this reaction, and then reconstruct a context from its bindings, we would lose this
                                                  * local variable.
                                                  *
                                                  * This and {@link QueuedConstructRepeatLogic.context} are the only cases where local variables
                                                  * persist beyond action performance.
                                                  */
                                                 readonly context: EvaluationContext;
                                             }

                                             /**
                                              * Base data for all queued constructs.
                                              */
                                             declare interface QueuedConstructBase {
                                                 /**
                                                  * Discriminator indicating the type of queued construct.
                                                  */
                                                 readonly type: QueuedConstructDiscriminator;
                                                 /**
                                                  * The name of the queued construct.
                                                  */
                                                 readonly constructName: ActionName | PlanName | SelectorName;
                                                 /**
                                                  * A unique identifier for the queued construct, provisioned by the host application via a call to
                                                  * the {@link HostApplicationAdapter.provisionActionID} adapter function. Should an actual action be performed or an actual
                                                  * plan be launched, the resulting action or plan will take on this UID.
                                                  */
                                                 readonly id: UID;
                                                 /**
                                                  * Whether the queued construct is to be marked urgent.
                                                  *
                                                  * For a queued action or action selector, this will cause it to be placed in the urgent heap of the
                                                  * associated initiator's action queue. For a queued plan or plan selector, this will cause the resulting
                                                  * plan to be immediately targeted (and potentially launched) upon being queued. This allows authors to
                                                  * specify complex action machinery that is intended to play out on the same timestep as precipitating action.
                                                  */
                                                 readonly urgent: boolean;
                                                 /**
                                                  * A mapping from a role name to an array of entity IDs for entities precast in that role.
                                                  */
                                                 readonly precastBindings: RoleBindings;
                                                 /**
                                                  * Entity IDs for all the actions recorded as causes of the queued construct.
                                                  *
                                                  * Whenever an action is ultimately performed by virtue of the queued construct -- even if transitively,
                                                  * e.g., via a plan queueing a plan queueing a plan that queues an action that is performed -- these causes
                                                  * will be recorded for the action as a matter of causal bookkeeping. This enables story sifting later on.
                                                  *
                                                  * Note that the causes here may contain multiple entries, which occurs when an action relays knowledge about
                                                  * the action to which the reaction was actually attached. To illustrate, consider the case of a reaction R
                                                  * that is attached to an action A1, which ultimately causes a queued action to be performed, which we will
                                                  * call Q. Now let's further say that Q's initiator, C, learned about A1, the direct cause of Q, via another
                                                  * action, A2, which relays knowledge about A1 -- i.e., A2 casts A1 in one of its roles. In this case, when
                                                  * C experiences A2, as a matter of course C will be cast in A1's special `hearer` role, with A1's effects
                                                  * and reactions being handled for C accordingly. It is through this process that Q, a reaction on A1,
                                                  * would be queued for C as a result of C learning about A1 via A2. In this case, both A1 and A2 would be
                                                  * included in the causes for Q, with A1 being the zeroth entry (see the note on this just below). Note
                                                  * that if A1 relays knowledge about an earlier action, A0, we will not evaluate A0's reactions upon C
                                                  * learning about A1 via A2. We only follow a single chain link for effect and reaction handling, since
                                                  * knowledge propagation would get out of hand otherwise.
                                                  *
                                                  * Because reaction declarations can be wrapped in conditionals and loops, the only way for the causes
                                                  * to make their way into the queued construct is insertion into the evaluation context, which we do
                                                  * via the special `__causes__` field in the evaluation context.
                                                  *
                                                  * Some more notes: no duplicates will appear here, and the zeroth entry will always be the action that
                                                  * directly triggered queuing. We place this one first in order to ground temporal constraints on reactions,
                                                  * which may be anchored in the timestamp of the action that triggered the reaction.
                                                  *
                                                  * If a plan triggered queueing, the action that queued the plan -- or the action that queued the plan
                                                  * that queued the plan, etc. -- will be the zeroth entry.
                                                  */
                                                 readonly causes: UID[];
                                                 /**
                                                  * Abandonment conditions for the queued construct.
                                                  *
                                                  * If *all* these hold at any point at which the queued construct is being targeted, it will be dequeued.
                                                  */
                                                 abandonmentConditions?: QueuedConstructAbandonmentConditions;
                                                 /**
                                                  * Repeat logic for the queued construct.
                                                  */
                                                 repeatLogic?: QueuedConstructRepeatLogic;
                                             }

                                             /**
                                              * Enum specifying the discriminators for all queued construct variants.
                                              */
                                             export declare enum QueuedConstructDiscriminator {
                                                 /**
                                                  * A queued action.
                                                  */
                                                 Action = "action",
                                                 /**
                                                  * A queued action selector.
                                                  */
                                                 ActionSelector = "actionSelector",
                                                 /**
                                                  * A queued plan.
                                                  */
                                                 Plan = "plan",
                                                 /**
                                                  * A queued plan selector.
                                                  */
                                                 PlanSelector = "planSelector"
                                             }

                                             /**
                                              * Repeat logic for a queued construct.
                                              *
                                              * If the queued construct succeeds, meaning the associated action is performed or the plan resolves
                                              * successfully, the construct will be re-queued provided all conditions hold and its instances have
                                              * not all been exhausted.
                                              */
                                             declare interface QueuedConstructRepeatLogic {
                                                 /**
                                                  * An array of Viv expressions such that, if all of them hold (i.e., evaluate to truthy values)
                                                  * after the queued construct succeeds, a copy of the construct will be re-queued.
                                                  */
                                                 readonly conditions: Expression[];
                                                 /**
                                                  * The evaluation context to use when evaluating the repeat conditions.
                                                  *
                                                  * At the time a reaction declaration was executed to queue the construct, this will have been dehydrated,
                                                  * meaning all entity data will have been converted into entity IDs. This allows the runtime to pull the
                                                  * latest entity state at the time of condition evaluation.
                                                  *
                                                  * This and {@link QueuedConstructAbandonmentConditions.context} are the only cases where local
                                                  * variables persist beyond action performance.
                                                  */
                                                 readonly context: EvaluationContext;
                                                 /**
                                                  * The remaining number of times this construct may be re-queued upon successful performance/execution.
                                                  *
                                                  * This value is decremented on each instance of re-queueing, and when it reaches zero,
                                                  * no further re-queueing will occur.
                                                  */
                                                 readonly remainingInstances: number;
                                             }

                                             /**
                                              * Enum specifying the possible statuses for a Viv queued construct.
                                              *
                                              * Each queued construct begins with a pending status, prior to a terminal status (success or failure)
                                              * being reached. A terminal status can never change.
                                              *
                                              * *This is an internal type that is not part of the stable API surface. Its shape may change in any release.*
                                              *
                                              * @internal
                                              * @category Other
                                              */
                                             export declare enum QueuedConstructStatus {
                                                 /**
                                                  * The queued construct failed, meaning it was dequeued. This can happen for a variety reason,
                                                  * such as expiration, abandonment conditions holding, or the failure of a step in a plan.
                                                  */
                                                 Failed = "failed",
                                                 /**
                                                  * The queued construct is still pending:
                                                  *  - If it is an action or an action selector, it is still queued.
                                                  *  - If it is a plan or a plan selector, it is either still queued or is currently underway.
                                                  *
                                                  * This is the default status for a queued construct, prior to a terminal status being reached.
                                                  */
                                                 Pending = "pending",
                                                 /**
                                                  * The queued construct succeeded:
                                                  *  - If it is an action or an action selector, an action was performed.
                                                  *  - If it is a plan or a plan selector, a plan was launched.
                                                  */
                                                 Succeeded = "succeeded"
                                             }

                                             /**
                                              * A mapping from queued-construct UID to queued-construct status, for all constructs that have ever been queued.
                                              *
                                              * @category Other
                                              */
                                             export declare type QueuedConstructStatuses = Record<UID, QueuedConstructStatus>;

                                             /**
                                              * A plan that is queued for potential future launching by the planner.
                                              *
                                              * Concretely, a plan is queued when a reaction declaration for an action (or another plan) is acted upon.
                                              * Queueing entails appending to the global plan queue, which is not sorted in any priority order. Instead,
                                              * the planner greedily pursues all queued plans (and plan selectors) each tick. If a plan is successfully
                                              * targeted, because its required roles can be cast, then it will be launched. Ultimately there is no
                                              * guarantee that the plan will actually be launched, since the author can constrain launching in
                                              * various ways, including via expiration and abandonment criteria.
                                              */
                                             export declare interface QueuedPlan extends QueuedConstructBase {
                                                 /**
                                                  * Discriminator for a queued plan.
                                                  */
                                                 readonly type: QueuedConstructDiscriminator.Plan;
                                                 /**
                                                  * The name of the queued plan.
                                                  */
                                                 readonly constructName: PlanName;
                                             }

                                             /**
                                              * A plan selector that is queued for future consideration by the planner.
                                              *
                                              * Concretely, a plan selector is queued when a reaction declaration for an action (or a plan) is acted upon.
                                              * Queueing entails appending the plan selector to the global plan queue, which is not sorted in any priority
                                              * order. Instead, the planner greedily pursues all queued plans (and plan selectors) each tick. A plan selector
                                              * is successfully targeted when its required roles can be cast and it successfully launches one of its associated
                                              * plans. Ultimately there is no guarantee that any plan will actually be launched, since the author can constrain
                                              * launching in various ways, including via expiration and abandonment criteria.
                                              */
                                             export declare interface QueuedPlanSelector extends QueuedConstructBase {
                                                 /**
                                                  * Discriminator for a queued plan selector.
                                                  */
                                                 readonly type: QueuedConstructDiscriminator.PlanSelector;
                                                 /**
                                                  * The name of the queued plan selector.
                                                  */
                                                 readonly constructName: SelectorName;
                                             }

                                             /**
                                              * Invokes the Viv planner to force queueing of the specific given plan.
                                              *
                                              * This function can be useful for debugging, and it can also support designs where a host application
                                              * takes a more direct role in narrative control. For instance, a host application might implement
                                              * something like a drama manager that decides to orchestrate high-level logic around actions that
                                              * should be pursued. For instance, the drama manager could decide that a particular character should
                                              * begin to pursue some course of action that is captured in a plan, which can be precipitated by passing
                                              * that plan along here. Of course, plans can always be selected in the course of normal Viv operation,
                                              * but it can be also be useful to force plan queueing to assert more fine-grained control.
                                              *
                                              * @category Planning
                                              * @example
                                              * ```ts
                                              * const planID = await queuePlan({
                                              *     planName: "move-to-big-city",
                                              *     urgent: true,
                                              *     precastBindings: { "mover": ["cid-alice"], "city": ["cid-nyc"] },
                                              *     causes: ["aid-824"]
                                              * });
                                              * console.log(`Queued plan with UID '${planID}'`);
                                              * ```
                                              * @param args - See {@link QueuePlanArgs}.
                                              * @returns - See {@link QueuePlanResult}.
                                              * @throws {@link VivNotInitializedError} If Viv is not initialized.
                                                  * @throws {@link VivInterpreterError} If the Viv interpreter encounters an issue in the course of plan queueing.
                                                      * @throws {@link VivValidationError} If the supplied `args` do not conform to the expected schema.
                                                          * @throws {@link VivValidationError} If there is no defined plan with the given `planName`.
                                                              * @throws {@link VivValidationError} If `causes` is provided, but contains something
                                                                  *     other than an entity ID for an action.
                                                                  */
                                                              export declare function queuePlan(args: QueuePlanArgs): Promise<QueuePlanResult>;

                                                              /**
                                                               * Arguments parameterizing a request to force queueing of a specific plan, potentially urgently.
                                                               *
                                                               * Note: No initiator is specified here because, unlike actions, plans are executed globally without
                                                               * regard to any single character. Indeed, plans can orchestrate actions that will be initiated by
                                                               * distinct characters. This is why queued plans live in a global plan queue (stored in the
                                                               * {@link VivInternalState}), as opposed to character-specific queues (as with queued actions).
                                                               *
                                                               * @category Other
                                                               * @remarks These are the effective arguments to {@link queuePlan}.
                                                               */
                                                              export declare interface QueuePlanArgs {
                                                                  /**
                                                                   * The name of the plan to queue.
                                                                   */
                                                                  readonly planName: PlanName;
                                                                  /**
                                                                   * Whether to queue the plan *urgently*.
                                                                   *
                                                                   * If this flag is set, the planner will immediately target the plan upon queueing it. If this initial
                                                                   * targeting succeeds, the plan will be launched immediately and then greedily executed to the degree
                                                                   * possible, up to potential resolution. This matches the behavior that occurs when a reaction queues
                                                                   * a plan (or plan selector) with a truthy `urgent` value.
                                                                   *
                                                                   * If the flag is *not* set, the planner will queue the plan immediately, but will not attempt to
                                                                   * target it until the next {@link tickPlanner}.
                                                                   *
                                                                   * Note: This should always be `true` when present.
                                                                   *
                                                                   * @defaultValue false
                                                                   */
                                                                  readonly urgent?: true;
                                                                  /**
                                                                   * Partial or complete role bindings to use when targeting the plan.
                                                                   *
                                                                   * If there are any required role slots that have not been precast here, the role caster will attempt
                                                                   * to fill them, and targeting will fail if they cannot be filled. Likewise, the role caster will also
                                                                   * attempt to fill any unfilled optional role slots.
                                                                   */
                                                                  readonly precastBindings?: RoleBindings;
                                                                  /**
                                                                   * An array containing entity IDs for arbitrary actions that the host application has indicated as causes
                                                                   * for the plan being queued. If the plan ultimately directly causes any actions to be performed, these will
                                                                   * be attributed as the causes of those actions.
                                                                   *
                                                                   * See the documentation for {@link AttemptActionArgs} for examples of design patterns enabled by this parameter.
                                                                   *
                                                                   * Note: The runtime will confirm that each entry here is in fact the entity ID for some action,
                                                                   * and it will also deduplicate the given causes automatically.
                                                                   */
                                                                  readonly causes?: UID[];
                                                              }

                                                              /**
                                                               * The UID for the queued plan, which can be used to monitor its `QueuedConstructStatus`
                                                               * and to retrieve its `PlanState` once the plan launches.
                                                               *
                                                               * @category Other
                                                               * @remarks This is the return value for {@link queuePlan}.
                                                               */
                                                              export declare type QueuePlanResult = UID;

                                                              /**
                                                               * A Viv reaction.
                                                               *
                                                               * A reaction specifies a construct (action, plan, or selector) that will be queued
                                                               * upon evaluation of the reaction expression.
                                                               */
                                                              declare interface Reaction extends SourceAnnotatedExpression {
                                                                  /**
                                                                   * Discriminator for Viv reaction expressions.
                                                                   */
                                                                  readonly type: ExpressionDiscriminator.Reaction;
                                                                  /**
                                                                   * The actual expression value.
                                                                   */
                                                                  readonly value: ReactionValue;
                                                              }

                                                              /**
                                                               * An object specifying logic around repeating the reaction after it *succeeds*.
                                                               *
                                                               * This logic is only considered when the construct queued by the reaction is successfully performed/executed.
                                                               *
                                                               * As a motivating example, consider the case of one character, Alice, trying to track down another character,
                                                               * Bob, to arrest him. The arrest action is queued by a plan, with high priority, but it requires the two
                                                               * characters to be in the same location. To make this happen, the plan queues a subplan that causes Alice
                                                               * to search for Bob, going to his home, workplace, and favorite haunts. This subplan will succeed if Alice
                                                               * travels to those places. But what if she doesn't find Bob in any of these spots? She should probably try
                                                               * again tomorrow, going to the likely spots once again.
                                                               *
                                                               * Using repeat logic, an author can easily specify this by declaring that, if the search subplan succeeds
                                                               * but Alice has not found Bob, it should be queued again. In this case, `conditions` would specify that
                                                               * Alice and Bob are not co-located, and `maxRepeats` would capture how many times Alice should attempt
                                                               * the search.
                                                               *
                                                               * Note: Viv already has automatic retry logic for reactions that can't be targeted currently.
                                                               */
                                                              declare interface ReactionRepeatLogic {
                                                                  /**
                                                                   * A set of expressions such that, if all of them hold (i.e., evaluate to a truthy value),
                                                                   * a copy of the reaction will be queued again for its initiator.
                                                                   */
                                                                  conditions: Expression[];
                                                                  /**
                                                                   * The maximum number of times this reaction may be repeated.
                                                                   */
                                                                  maxRepeats: number;
                                                              }

                                                              /**
                                                               * Union containing discriminators for the construct types that a reaction may queue.
                                                               */
                                                              declare type ReactionTargetConstructDiscriminator = ConstructDiscriminator.Action | ConstructDiscriminator.ActionSelector | ConstructDiscriminator.Plan | ConstructDiscriminator.PlanSelector;

                                                              /**
                                                               * The actual expression value for a Viv reaction.
                                                               */
                                                              declare interface ReactionValue {
                                                                  /**
                                                                   * The name of the target construct, i.e., the one queued up by this reaction.
                                                                   */
                                                                  readonly targetName: ActionName | PlanName | SelectorName;
                                                                  /**
                                                                   * The type of construct that the reaction will queue.
                                                                   */
                                                                  readonly targetType: ReactionTargetConstructDiscriminator;
                                                                  /**
                                                                   * Precast bindings for the target construct, as asserted in the reaction declaration.
                                                                   */
                                                                  readonly bindings: PrecastBindings;
                                                                  /**
                                                                   * An expression that should evaluate to a boolean value indicating whether the reaction
                                                                   * will queue its target construct urgently.
                                                                   *
                                                                   * The evaluated value will be cast to a boolean, so authors should be careful when using
                                                                   * this parameter. Urgent actions and action selectors receive the highest priority in
                                                                   * action queues, while an urgent plan or plan selector will be targeted (and potentially
                                                                   * launched) upon being queued.
                                                                   *
                                                                   * If no expression is supplied, the reaction will not be marked urgent.
                                                                   */
                                                                  readonly urgent: Expression | null;
                                                                  /**
                                                                   * An expression that should evaluate to a numeric value specifying the priority
                                                                   * of the queued construct.
                                                                   *
                                                                   * Within a given queue group (urgent or non-urgent), queued actions (and queued
                                                                   * action selectors) are targeted in descending order of priority.
                                                                   *
                                                                   * Because the global plan queue is unordered, the compiler will flag the use of
                                                                   * this option in a reaction queueing a plan or plan selector.
                                                                   */
                                                                  readonly priority: Expression | null;
                                                                  /**
                                                                   * An expression that should evaluate to a location, that being the specific location at which an
                                                                   * eventual action must be performed.
                                                                   *
                                                                   * The compiler will flag the use of this option in a reaction queueing a plan or plan selector.
                                                                   */
                                                                  readonly location: SetPredicate[] | null;
                                                                  /**
                                                                   * A set of 0-3 temporal constraints constraining the time at which an eventual action may be performed.
                                                                   *
                                                                   * The compiler will flag the use of this option in a reaction queueing a plan or plan selector.
                                                                   */
                                                                  readonly time: TemporalConstraint[] | null;
                                                                  /**
                                                                   * A set of expressions such that, if all of them hold (i.e., evaluate to a truthy value),
                                                                   * the queued construct will be dequeued.
                                                                   *
                                                                   * This will always be either `null` or a non-empty array.
                                                                   */
                                                                  readonly abandonmentConditions: Expression[] | null;
                                                                  /**
                                                                   * An object specifying logic around repeating the reaction should it succeed.
                                                                   *
                                                                   * Note: Viv already has automatic retry logic for reactions that can't be targeted currently.
                                                                   */
                                                                  readonly repeatLogic: ReactionRepeatLogic | null;
                                                              }

                                                              /**
                                                               * A component in a Viv reference path.
                                                               */
                                                              declare type ReferencePathComponent = ReferencePathComponentPropertyName | ReferencePathComponentPointer | ReferencePathComponentLookup;

                                                              /**
                                                               * Enum containing discriminators for the possible reference path components.
                                                               */
                                                              declare enum ReferencePathComponentDiscriminator {
                                                                  /**
                                                                   * Discriminator for a property-name reference path component.
                                                                   */
                                                                  ReferencePathComponentPropertyName = "referencePathComponentPropertyName",
                                                                  /**
                                                                   * Discriminator for a pointer reference path component.
                                                                   */
                                                                  ReferencePathComponentPointer = "referencePathComponentPointer",
                                                                  /**
                                                                   * Discriminator for a lookup reference path component.
                                                                   */
                                                                  ReferencePathComponentLookup = "referencePathComponentLookup"
                                                              }

                                                              /**
                                                               * A component of a Viv reference path specifying a property lookup or an array access,
                                                               * where the key/index can be specified by an arbitrary Viv expression.
                                                               */
                                                              declare interface ReferencePathComponentLookup extends FailSafeComponent {
                                                                  /**
                                                                   * Discriminator for a lookup reference path component.
                                                                   */
                                                                  readonly type: ReferencePathComponentDiscriminator.ReferencePathComponentLookup;
                                                                  /**
                                                                   * An expression that should evaluate to a valid JavaScript property key.
                                                                   *
                                                                   * This mainly comprises strings and integers. Note that in JavaScript, array indices
                                                                   * are actually just property keys.
                                                                   */
                                                                  readonly key: Expression;
                                                              }

                                                              /**
                                                               * A component of a Viv reference path specifying a pointer to dereference.
                                                               */
                                                              declare interface ReferencePathComponentPointer extends FailSafeComponent {
                                                                  /**
                                                                   * Discriminator for a pointer reference path component.
                                                                   */
                                                                  readonly type: ReferencePathComponentDiscriminator.ReferencePathComponentPointer;
                                                                  /**
                                                                   * The name of the property to access in the entity data of the entity targeted by the pointer.
                                                                   */
                                                                  readonly propertyName: string;
                                                              }

                                                              /**
                                                               * A component of a Viv reference path specifying a property to access.
                                                               */
                                                              declare interface ReferencePathComponentPropertyName extends FailSafeComponent {
                                                                  /**
                                                                   * Discriminator for a property-name reference path component.
                                                                   */
                                                                  readonly type: ReferencePathComponentDiscriminator.ReferencePathComponentPropertyName;
                                                                  /**
                                                                   * The name of the property to access.
                                                                   */
                                                                  readonly name: string;
                                                              }

                                                              /**
                                                               * The actual expression value for a Viv entity reference or symbol reference.
                                                               */
                                                              declare interface ReferenceValue extends FailSafeComponent {
                                                                  /**
                                                                   * The name anchoring this reference.
                                                                   */
                                                                  readonly anchor: RoleName | VariableName;
                                                                  /**
                                                                   * If applicable, the path to a specified property value.
                                                                   *
                                                                   * If the reference is just to the entity or symbol itself, this will be an empty list. Otherwise,
                                                                   * it will specify a path to a specific property value, either on that entity or symbol or another
                                                                   * entity (via a pointer).
                                                                   */
                                                                  readonly path: ReferencePathComponent[];
                                                                  /**
                                                                   * Whether the anchor is a local variable.
                                                                   *
                                                                   * This is a common pattern when an author loops over a group role.
                                                                   */
                                                                  readonly local: boolean;
                                                                  /**
                                                                   * Whether the anchor is marked as a group role, in which case it will evaluate
                                                                   * to an array containing the bindings for the role.
                                                                   */
                                                                  readonly group: boolean;
                                                              }

                                                              /**
                                                               * A mapping from a role name to an array of binding candidates cast in that role.
                                                               *
                                                               * Note that the actual arrays must be homogeneous in terms of type: only a symbol role may
                                                               * take symbol bindings, and symbol roles only allow symbol bindings. But from a TypeScript
                                                               * perspective, it's easiest to union over the element type here.
                                                               *
                                                               * @category Other
                                                               */
                                                              export declare type RoleBindings = Record<RoleName, RoleCandidate[]>;

                                                              /**
                                                               * The possible types that may be bound to a role.
                                                               *
                                                               * @category Other
                                                               */
                                                              export declare type RoleCandidate = UID | SymbolRoleBinding;

                                                              /**
                                                               * Enum specifying canonical descriptions for the possible causes of backtracking
                                                               * during role casting, which can be useful during debugging.
                                                               *
                                                               * @category Other
                                                               */
                                                              export declare enum RoleCastingBacktrackReason {
                                                                  /**
                                                                   * A prospective role candidate was blacklisted.
                                                                   */
                                                                  BlacklistedCandidate = "blacklisted role candidate",
                                                                  /**
                                                                   * A prospective role quorum was blacklisted.
                                                                   */
                                                                  BlacklistedQuorum = "blacklisted role quorum",
                                                                  /**
                                                                   * A prospective role candidate was already cast in another role.
                                                                   */
                                                                  CandidateAlreadyCast = "role candidate already cast",
                                                                  /**
                                                                   * A prospective role candidate failed the role conditions.
                                                                   */
                                                                  CandidateFailedConditions = "candidate failed role conditions",
                                                                  /**
                                                                   * A prospective role candidate was not present for a role requiring presence.
                                                                   */
                                                                  CandidateNotPresent = "role candidate not present",
                                                                  /**
                                                                   * A prospective role candidate violates an embargo.
                                                                   */
                                                                  CandidateViolatesEmbargo = "role candidate violates embargo",
                                                                  /**
                                                                   * The role at hand could not be cast in a way that would avoid failure while casting
                                                                   * a downstream role (i.e., a descendant in the role-dependency forest).
                                                                   */
                                                                  DownstreamFailure = "downstream role could not be cast",
                                                                  /**
                                                                   * The global conditions for the construct failed.
                                                                   */
                                                                  GlobalConditionsFailed = "global conditions failed",
                                                                  /**
                                                                   * The maximum number of slots for a role were filled, but there were outstanding
                                                                   * precast candidates for that role.
                                                                   */
                                                                  OutstandingPrecastCandidate = "outstanding precast candidate(s)",
                                                                  /**
                                                                   * The casting pool was exhausted, but the minimum number of slots for a role
                                                                   * were not filled.
                                                                   */
                                                                  MinSlotsNotFilled = "min slots not filled",
                                                                  /**
                                                                   * The casting pool contained fewer candidates than the minimum number of role slots.
                                                                   */
                                                                  PoolTooSmall = "casting pool too small",
                                                                  /**
                                                                   * A precast candidate could not be cast in its associated role.
                                                                   */
                                                                  PrecastCandidateCouldNotBeCast = "precast candidate could not be cast",
                                                                  /**
                                                                   * A candidate precast for a role is not included in the actual casting pool
                                                                   * derived for the role.
                                                                   */
                                                                  PrecastCandidateNotInPool = "precast candidate not in casting pool",
                                                                  /**
                                                                   * A member of a prospective role quorum failed the role conditions.
                                                                   */
                                                                  QuorumMemberFailedConditions = "quorum member failed role conditions",
                                                                  /**
                                                                   * A prospective role quorum failed the role conditions.
                                                                   */
                                                                  QuorumFailedConditions = "quorum failed role conditions"
                                                              }

                                                              /**
                                                               * A definition for a role in a construct.
                                                               */
                                                              declare interface RoleDefinition {
                                                                  /**
                                                                   * A name for this role, unique only within the associated construct definition.
                                                                   */
                                                                  readonly name: RoleName;
                                                                  /**
                                                                   * The type of entity (or symbol) that must be cast in this role.
                                                                   */
                                                                  readonly entityType: RoleEntityType;
                                                                  /**
                                                                   * The minimum number of slots to cast for this role.
                                                                   */
                                                                  readonly min: number;
                                                                  /**
                                                                   * The maximum number of slots to cast for this role.
                                                                   */
                                                                  readonly max: number;
                                                                  /**
                                                                   * The name of this role's parent, if any, in the dependency tree that is used during role casting.
                                                                   *
                                                                   * This dependency tree is used to optimize this process.
                                                                   */
                                                                  readonly parent: RoleName | null;
                                                                  /**
                                                                   * The names of this role's children, if any, in the dependency tree that is used during casting.
                                                                   *
                                                                   * This dependency tree is used to optimize this process.
                                                                   */
                                                                  readonly children: string[];
                                                                  /**
                                                                   * If specified, a directive specifying the pool of entities who may be cast into this role
                                                                   * at a given point in time, given an initiator and possibly other prospective role bindings.
                                                                   *
                                                                   * If this is an action role, and if there is an active {@link EvaluationContext.__searchDomain__},
                                                                   * the pool will automatically be filtered to actions in the search domain. This occurs in {@link getCustomPool}.
                                                                   */
                                                                  readonly pool: CastingPool | null;
                                                                  /**
                                                                   * If specified, the chance that a qualifying entity will be cast into the role.
                                                                   *
                                                                   * This field was first implemented to support a pattern of specifying how likely it is that
                                                                   * a given nearby character will witness an action, which can be accomplished by defining a
                                                                   * `bystander` role with a high `max` and a specified `chance` value.
                                                                   *
                                                                   * The compiler restricts chance values to `[0.0, 1.0]`.
                                                                   */
                                                                  readonly chance: number | null;
                                                                  /**
                                                                   * If specified, a mean on which to anchor a distribution from which will be sampled
                                                                   * the number of entities to cast into the role.
                                                                   *
                                                                   * The compiler guarantees that `mean` and `sd` are either both present or both elided.
                                                                   */
                                                                  readonly mean: number | null;
                                                                  /**
                                                                   * If specified, a standard deviation for a distribution from which will be sampled
                                                                   * the number of entities to cast into the role.
                                                                   *
                                                                   * The compiler guarantees that `mean` and `sd` are either both present or both elided.
                                                                   */
                                                                  readonly sd: number | null;
                                                                  /**
                                                                   * If applicable, the mode of participation for a character cast in this role.
                                                                   *
                                                                   * This field is only non-null for action roles that cast characters who are physically
                                                                   * present for the action (i.e., ones for which `anywhere` is `false`).
                                                                   */
                                                                  readonly participationMode: RoleParticipationMode | null;
                                                                  /**
                                                                   * Whether an entity cast in this role does not need to be physically present for the action.
                                                                   *
                                                                   * Note that the entity *can* still be physically present, so authors should take care to write
                                                                   * conditions specifying whether an entity is present, as needed.
                                                                   *
                                                                   * Currently, this only applies to characters and items, though roles casting all other
                                                                   * entity types will have `true` here.
                                                                   */
                                                                  readonly anywhere: boolean;
                                                                  /**
                                                                   * Whether this role must be precast and never cast through typical role casting.
                                                                   *
                                                                   * For an action, a role can be "precast" via a reaction declaration that targets the action. For other
                                                                   * constructs, a role can be precast in the expression targeting the construct -- e.g., an action search
                                                                   * can precast a role for a query.
                                                                   *
                                                                   * If an action has a precast role, it must be marked `reserved`, because there is no way
                                                                   * to cast a precast role via general action targeting.
                                                                   */
                                                                  readonly precast: boolean;
                                                                  /**
                                                                   * Whether the entity cast in this role is to be constructed as a result of the associated action.
                                                                   *
                                                                   * Spawn roles only appear in actions, and the compiler ensures that `spawn` and `spawnFunction`
                                                                   * are either both truthy or both falsy.
                                                                   */
                                                                  readonly spawn: boolean;
                                                                  /**
                                                                   * For `spawn` roles only, a custom-function call that will cause the new entity
                                                                   * (to be cast in this role) to be constructed before returning its entity ID.
                                                                   *
                                                                   * Spawn roles only appear in actions, and the compiler ensures that `spawn` and `spawnFunction`
                                                                   * are either both truthy or both falsy.
                                                                   */
                                                                  readonly spawnFunction: CustomFunctionCall | null;
                                                                  /**
                                                                   * If this role is an alias for a role in a parent definition, this will
                                                                   * store the name of the original role.
                                                                   */
                                                                  readonly renames: RoleName | null;
                                                              }

                                                              /**
                                                               * Enum specifying the entity types that may be associated with a role definition.
                                                               */
                                                              declare enum RoleEntityType {
                                                                  /**
                                                                   * The role casts an action.
                                                                   */
                                                                  Action = "action",
                                                                  /**
                                                                   * The role casts a character.
                                                                   */
                                                                  Character = "character",
                                                                  /**
                                                                   * The role casts an item.
                                                                   */
                                                                  Item = "item",
                                                                  /**
                                                                   * The role casts a location.
                                                                   */
                                                                  Location = "location",
                                                                  /**
                                                                   * The role casts a symbol.
                                                                   */
                                                                  Symbol = "symbol"
                                                              }

                                                              /**
                                                               * A name for a role (unique only within its definition).
                                                               *
                                                               * @category Other
                                                               */
                                                              export declare type RoleName = string;

                                                              /**
                                                               * Enum specifying the participation modes for action roles that cast characters.
                                                               *
                                                               * To be clear, these are *only* applicable to action roles that cast characters.
                                                               */
                                                              declare enum RoleParticipationMode {
                                                                  /**
                                                                   * The role casts a bystander who is an uninvolved witness to the associated action.
                                                                   */
                                                                  Bystander = "bystander",
                                                                  /**
                                                                   * The role casts the single initiator of an action.
                                                                   */
                                                                  Initiator = "initiator",
                                                                  /**
                                                                   * The role casts a partner who helps to initiate an action.
                                                                   */
                                                                  Partner = "partner",
                                                                  /**
                                                                   * The role casts a recipient of an action.
                                                                   */
                                                                  Recipient = "recipient"
                                                              }

                                                              /**
                                                               * Executes the given search query over the specified search domain, and returns entity IDs for matching actions.
                                                               *
                                                               * @category Story Sifting
                                                               * @example
                                                               * ```ts
                                                               * const matches = await runSearchQuery({
                                                               *     queryName: "proud-of-child",
                                                               *     precastBindings: { parent: ["cid-alice"] },
                                                               *     searchDomain: "cid-alice",
                                                               *     limit: 10
                                                               * });
                                                               * if (!matches.length) {
                                                               *     console.log("No matches found");
                                                               * }
                                                               * ```
                                                               * @param args - See {@link RunSearchQueryArgs}.
                                                               * @returns - See {@link RunSearchQueryResult}.
                                                               * @throws {@link VivNotInitializedError} If Viv has not been initialized.
                                                                   * @throws {@link VivInterpreterError} If the Viv interpreter encounters an issue in the course of query execution.
                                                                       * @throws {@link VivValidationError} If the supplied `args` do not conform to the expected schema.
                                                                           * @throws {@link VivValidationError} If there is no defined search query with the given `queryName`.
                                                                               * @throws {@link VivValidationError} If `searchDomain` is provided, but is not the entity ID for a character.
                                                                                   */
                                                                               export declare function runSearchQuery(args: RunSearchQueryArgs): Promise<RunSearchQueryResult>;

                                                                               /**
                                                                                * Arguments parameterizing a request to run a specified search query.
                                                                                *
                                                                                * @category Other
                                                                                * @remarks These are the effective arguments to {@link runSearchQuery}.
                                                                                */
                                                                               export declare interface RunSearchQueryArgs {
                                                                                   /**
                                                                                    * The name of the query to run.
                                                                                    */
                                                                                   readonly queryName: QueryName;
                                                                                   /**
                                                                                    * Partial or complete role bindings to use when running the search query.
                                                                                    */
                                                                                   readonly precastBindings?: RoleBindings;
                                                                                   /**
                                                                                    * The entity ID for a character whose memories will serve as the search domain, if any.
                                                                                    *
                                                                                    * When this field is present, the search query is run against the given character's memories,
                                                                                    * and otherwise the pattern is run against the entire chronicle -- meaning all actions that have
                                                                                    * ever occurred in the simulation instance at hand. If the specified search query uses memory
                                                                                    * criteria (the `salience` and/or `associations` fields), an error will be thrown if a search
                                                                                    * domain is not provided.
                                                                                    */
                                                                                   readonly searchDomain?: UID;
                                                                                   /**
                                                                                    * The maximum number of query matches to return.
                                                                                    *
                                                                                    * If omitted, all matches are returned.
                                                                                    *
                                                                                    * Integers are most sensible, and any value here must be greater than or equal to one.
                                                                                    */
                                                                                   readonly limit?: number;
                                                                               }

                                                                               /**
                                                                                * An array containing zero or more matches for the search query that was run.
                                                                                *
                                                                                * Each entry in the array is the entity ID for an action matching the query.
                                                                                *
                                                                                * @category Other
                                                                                * @remarks This is the return value for {@link runSearchQuery}.
                                                                                */
                                                                               export declare type RunSearchQueryResult = UID[];

                                                                               /**
                                                                                * Runs the specified sifting pattern over the specified search domain, and returns
                                                                                * a single match, if one can be found, else `null`.
                                                                                *
                                                                                * @category Story Sifting
                                                                                * @example
                                                                                * ```ts
                                                                                * const match = await runSiftingPattern({
                                                                                *     patternName: "rags-to-riches",
                                                                                *     precastBindings: { protagonist: ["cid-alice"] },
                                                                                *     searchDomain: "cid-alice"
                                                                                * });
                                                                                * if (!match) {
                                                                                *     console.log("No match found");
                                                                                * }
                                                                                * ```
                                                                                * @param args - See {@link RunSiftingPatternArgs}.
                                                                                * @returns - See {@link RunSiftingPatternResult}.
                                                                                * @throws {@link VivNotInitializedError} If Viv has not been initialized.
                                                                                    * @throws {@link VivInterpreterError} If the Viv interpreter encounters an issue in the course of sifting.
                                                                                        * @throws {@link VivValidationError} If the supplied `args` do not conform to the expected schema.
                                                                                            * @throws {@link VivValidationError} If there is no defined sifting pattern with the given `patternName`.
                                                                                                * @throws {@link VivValidationError} If `searchDomain` is provided, but is not the entity ID for a character.
                                                                                                    */
                                                                                                export declare function runSiftingPattern(args: RunSiftingPatternArgs): Promise<RunSiftingPatternResult>;

                                                                                                /**
                                                                                                 * Arguments parameterizing a request to run a specified sifting pattern.
                                                                                                 *
                                                                                                 * @category Other
                                                                                                 * @remarks These are the effective arguments to {@link runSiftingPattern}.
                                                                                                 */
                                                                                                export declare interface RunSiftingPatternArgs {
                                                                                                    /**
                                                                                                     * The name of the sifting pattern to run.
                                                                                                     */
                                                                                                    readonly patternName: SiftingPatternName;
                                                                                                    /**
                                                                                                     * Partial or complete role bindings to use when running the sifting pattern.
                                                                                                     */
                                                                                                    readonly precastBindings?: RoleBindings;
                                                                                                    /**
                                                                                                     * The entity ID for a character whose memories will serve as the search domain.
                                                                                                     *
                                                                                                     * When this field is present, the sifting pattern is run against the given character's memories,
                                                                                                     * and otherwise the pattern is run against the entire chronicle (meaning all actions that have
                                                                                                     * ever occurred in the simulation instance at hand).
                                                                                                     */
                                                                                                    readonly searchDomain?: UID;
                                                                                                }

                                                                                                /**
                                                                                                 * A single match for the sifting pattern that was run, if there was one, else `null`.
                                                                                                 *
                                                                                                 * A sifting match takes the form of a mapping from role names to arrays of entity IDs, where the role
                                                                                                 * names correspond to the action roles defined in the sifting pattern's `actions` field, and the entity
                                                                                                 * IDs are the actions that were cast in those roles in the course of constructing the sifting match.
                                                                                                 *
                                                                                                 * @category Other
                                                                                                 * @remarks This is the return value for {@link runSiftingPattern}.
                                                                                                 */
                                                                                                export declare type RunSiftingPatternResult = SiftingMatch | null;

                                                                                                /**
                                                                                                 * Specifications for determining a numeric salience score for the action that will be held
                                                                                                 * by a given character who experiences, observes, or otherwise learns about the action.
                                                                                                 */
                                                                                                declare interface Saliences {
                                                                                                    /**
                                                                                                     * A specification for a default value to be used as a fallback for any character for which
                                                                                                     * there is no applicable `roles` entry and for which no `custom` expression yielded a value.
                                                                                                     *
                                                                                                     * This will always be structured as a Viv enum, int, or float, where even the enum should
                                                                                                     * resolve to a numeric value.
                                                                                                     */
                                                                                                    readonly default: SalienceScoreExpression;
                                                                                                    /**
                                                                                                     * A mapping from role names to expressions yielding salience values.
                                                                                                     *
                                                                                                     * For a character who is bound in the given role, the corresponding expression
                                                                                                     * will determine the salience value.
                                                                                                     */
                                                                                                    readonly roles: Record<RoleName, SalienceScoreExpression>;
                                                                                                    /**
                                                                                                     * For characters for whom no `roles` entry applies, a series of zero or more custom salience-yielding
                                                                                                     * expressions will be evaluated, with the character bound to the local variable specified in the
                                                                                                     * `variable` property.
                                                                                                     *
                                                                                                     * These will be evaluated in turn, with the first numeric evaluated value being assigned as
                                                                                                     * the character's salience. If no custom expression evaluates to a numeric value, the default
                                                                                                     * value will be used.
                                                                                                     *
                                                                                                     * This field is only used if there is no applicable per-role field for the character at hand.
                                                                                                     */
                                                                                                    readonly custom: Expression[];
                                                                                                    /**
                                                                                                     * If there is a non-empty `custom` field, the local variable to which a character
                                                                                                     * will be bound when computing a salience for them.
                                                                                                     *
                                                                                                     * This allows for evaluation of the body expressions, which may refer to this variable
                                                                                                     * in order to do things like conditionalize salience based on the character at hand.
                                                                                                     */
                                                                                                    readonly variable: LocalVariable | null;
                                                                                                }

                                                                                                /**
                                                                                                 * An expression that evaluates to a numeric salience score.
                                                                                                 */
                                                                                                declare type SalienceScoreExpression = Enum | IntField | FloatField;

                                                                                                /**
                                                                                                 * A prepared search domain, ready for use in story sifting.
                                                                                                 */
                                                                                                declare interface SearchDomain {
                                                                                                    /**
                                                                                                     * An array containing entity IDs for all actions in the search domain at hand.
                                                                                                     */
                                                                                                    readonly domain: UID[];
                                                                                                    /**
                                                                                                     * If applicable, the memories associated with the actions in the search domain.
                                                                                                     *
                                                                                                     * This layer is needed to evaluate query criteria pertaining to saliences and associations.
                                                                                                     *
                                                                                                     * If we are searching over the full chronicle, this will be elided.
                                                                                                     */
                                                                                                    readonly memoryLayer: CharacterMemories | null;
                                                                                                }

                                                                                                /**
                                                                                                 * A declaration for how to prepare a search domain for a {@link ActionSearch} or a {@link Sifting}.
                                                                                                 */
                                                                                                declare interface SearchDomainDeclaration {
                                                                                                    /**
                                                                                                     * The policy to use when preparing the search domain.
                                                                                                     */
                                                                                                    readonly policy: SearchDomainPreparationPolicy;
                                                                                                    /**
                                                                                                     * If the search is to run over a character's memories, this is an expression that should
                                                                                                     * evaluate to a reference to that character.
                                                                                                     *
                                                                                                     * If `null` is here, the query will be run over the chronicle (all historical actions),
                                                                                                     * though an error will be thrown if a query is specified and it uses memory criteria (the
                                                                                                     * `salience` and/or `associations` fields).
                                                                                                     *
                                                                                                     * A few notes:
                                                                                                     *  - The compiler will ensure that a value is only present here if `policy` is
                                                                                                     *    {@link SearchDomainPreparationPolicy.Expression}.
                                                                                                     *  - If there is already a search domain enclosing this one, the resulting domain will
                                                                                                     *    be narrowed to the intersection of the two domains (the existing one and the memories
                                                                                                     *    of the character specified by this expression).
                                                                                                     *  - If a character has {@link CharacterMemory.forgotten} an action, it will
                                                                                                     *    not be included in the constructed search domain.
                                                                                                     */
                                                                                                    readonly expression: Expression | null;
                                                                                                }

                                                                                                /**
                                                                                                 * Enum containing the valid policies for preparing search domains for story sifting.
                                                                                                 */
                                                                                                declare enum SearchDomainPreparationPolicy {
                                                                                                    /**
                                                                                                     * Search in the full chronicle (all historical actions).
                                                                                                     */
                                                                                                    Chronicle = "chronicle",
                                                                                                    /**
                                                                                                     * Search the memories of the character specified by the
                                                                                                     * {@link SearchDomainPreparationPolicy.expression}.
                                                                                                     */
                                                                                                    Expression = "expression",
                                                                                                    /**
                                                                                                     * Inherit the search domain passed into the evaluation context for the action search or sifting.
                                                                                                     */
                                                                                                    Inherit = "inherit"
                                                                                                }

                                                                                                /**
                                                                                                 * Invokes the Viv action manager to carry out action selection for the given initiator, and then
                                                                                                 * returns the entity ID for the action that is performed as a result, if any, else `null`.
                                                                                                 *
                                                                                                 * **Important:** Calls to this function must be resolved sequentially, not concurrently (e.g.,
                                                                                                 * via `Promise.all`). The runtime assumes that each action is fully performed before the next
                                                                                                 * `selectAction` call begins, because actions mutate shared simulation state that subsequent
                                                                                                 * calls depend on. Concurrent calls could produce situations like a character performing a
                                                                                                 * physical action with another character who has already left that location. In summary:
                                                                                                 * action selection cannot be parallelized in Viv, at least at this time.
                                                                                                 *
                                                                                                 * @category Actions
                                                                                                 * @example
                                                                                                 * ```ts
                                                                                                 * // Correct: sequential await for each character
                                                                                                 * for (const characterID of allCharacterIDs) {
                                                                                                 *     await selectAction({ initiatorID: characterID });
                                                                                                 * }
                                                                                                 * ```
                                                                                                 * @param args - See {@link SelectActionArgs}.
                                                                                                 * @returns - See {@link SelectActionResult}.
                                                                                                 * @throws {@link VivNotInitializedError} If Viv has not been initialized.
                                                                                                     * @throws {@link VivInterpreterError} If the Viv interpreter encounters an issue in the course of action targeting.
                                                                                                         * @throws {@link VivValidationError} If the supplied `args` do not conform to the expected schema.
                                                                                                             * @throws {@link VivValidationError} If `initiatorID` is not an entity ID for a character.
                                                                                                                 */
                                                                                                             export declare function selectAction(args: SelectActionArgs): Promise<SelectActionResult>;

                                                                                                             /**
                                                                                                              * Arguments parameterizing a request to carry out action selection on behalf of the given character.
                                                                                                              *
                                                                                                              * @category Other
                                                                                                              * @remarks These are the effective arguments to {@link selectAction}.
                                                                                                              */
                                                                                                             export declare interface SelectActionArgs {
                                                                                                                 /**
                                                                                                                  * Entity ID for the character for whom action selection will be undertaken. Should an action be
                                                                                                                  * performed as a result, this character will be cast in its initiator role.
                                                                                                                  */
                                                                                                                 readonly initiatorID: UID;
                                                                                                                 /**
                                                                                                                  * Whether to exclusively target queued actions or action selectors
                                                                                                                  * marked urgent (in the given initiator's queue).
                                                                                                                  *
                                                                                                                  * If this flag is set, *only* urgent queued actions will be targeted, and action selection will fail
                                                                                                                  * if no urgent queued actions exist or none are successfully performed.
                                                                                                                  *
                                                                                                                  * If the flag is *not* set, the action manager will also target each of the character's non-urgent
                                                                                                                  * queued actions, if any. And if there are none of those, or if none are successfully performed,
                                                                                                                  * the action manager will then attempt to perform a general action, meaning one that is defined
                                                                                                                  * in the Viv content bundle and is not marked `reserved`. If any action is successfully performed,
                                                                                                                  * this function will return its entity ID, else `null`.
                                                                                                                  *
                                                                                                                  * This enables a simulation pattern whereby characters target urgent actions once a timestep
                                                                                                                  * has otherwise completed, to allow for emergent sequences to fully play out.
                                                                                                                  *
                                                                                                                  * Note: This should always be `true` when present.
                                                                                                                  *
                                                                                                                  * @defaultValue false
                                                                                                                  */
                                                                                                                 readonly urgentOnly?: true;
                                                                                                             }

                                                                                                             /**
                                                                                                              * If an action was successfully performed, its entity ID, else `null`.
                                                                                                              *
                                                                                                              * @category Other
                                                                                                              * @remarks This is the return value for {@link selectAction}.
                                                                                                              */
                                                                                                             export declare type SelectActionResult = UID | null;

                                                                                                             /**
                                                                                                              * A candidate that may be targeted via a selector.
                                                                                                              */
                                                                                                             declare interface SelectorCandidate {
                                                                                                                 /**
                                                                                                                  * The name of the candidate, i.e., the name of the construct to target.
                                                                                                                  */
                                                                                                                 readonly name: ActionName | PlanName | SelectorName;
                                                                                                                 /**
                                                                                                                  * Whether the candidate is a selector. The compiler ensures that action selectors can only
                                                                                                                  * target other action selectors, and that plan selectors can only target other plan selectors.
                                                                                                                  */
                                                                                                                 readonly isSelector: boolean;
                                                                                                                 /**
                                                                                                                  * Precast bindings for the candidate, as asserted in the selector definition.
                                                                                                                  */
                                                                                                                 readonly bindings: PrecastBindings;
                                                                                                                 /**
                                                                                                                  * If applicable, an expression that will evaluate to the weight for this candidate, which will be
                                                                                                                  * used as part of a weighted random sort procedure (see {@link SelectorPolicy}).
                                                                                                                  */
                                                                                                                 readonly weight: Expression | null;
                                                                                                             }

                                                                                                             /**
                                                                                                              * The base shape shared between action selectors and plan selectors.
                                                                                                              */
                                                                                                             declare interface SelectorDefinitionBase {
                                                                                                                 /**
                                                                                                                  * Discriminator for selector's construct type.
                                                                                                                  */
                                                                                                                 readonly type: ConstructDiscriminator.ActionSelector | ConstructDiscriminator.PlanSelector;
                                                                                                                 /**
                                                                                                                  * The (unique) name of the selector.
                                                                                                                  */
                                                                                                                 readonly name: SelectorName;
                                                                                                                 /**
                                                                                                                  * Mapping from the names of the roles associated with this selector to their respective role definitions.
                                                                                                                  *
                                                                                                                  * Note that the roles appear in the order in which the author defined them.
                                                                                                                  */
                                                                                                                 readonly roles: Record<RoleName, RoleDefinition>;
                                                                                                                 /**
                                                                                                                  * The names of the roles constituting the roots of the trees composing role-dependency
                                                                                                                  * forest for this selector definition.
                                                                                                                  *
                                                                                                                  * The roots are given in the order by which role casting will proceed.
                                                                                                                  */
                                                                                                                 readonly roleForestRoots: RoleName[];
                                                                                                                 /**
                                                                                                                  * Conditions for the selector, grouped by role name (with the special global-conditions key).
                                                                                                                  *
                                                                                                                  * A condition is an expression that must hold (i.e., evaluate to a truthy value) in order
                                                                                                                  * for the selector to be targeted.
                                                                                                                  */
                                                                                                                 readonly conditions: ConstructConditions;
                                                                                                                 /**
                                                                                                                  * The sort policy that will be used to determine the order in which candidates will be targeted.
                                                                                                                  */
                                                                                                                 readonly policy: SelectorPolicy;
                                                                                                                 /**
                                                                                                                  * The candidates (actions and/or other action selectors) that may be targeted via this selector.
                                                                                                                  */
                                                                                                                 readonly candidates: SelectorCandidate[];
                                                                                                             }

                                                                                                             /**
                                                                                                              * A unique name for a selector.
                                                                                                              *
                                                                                                              * @category Other
                                                                                                              */
                                                                                                             export declare type SelectorName = string;

                                                                                                             /**
                                                                                                              * Enum containing the valid selector policies.
                                                                                                              */
                                                                                                             declare enum SelectorPolicy {
                                                                                                                 /**
                                                                                                                  * Target the candidates in the author-specified order.
                                                                                                                  */
                                                                                                                 Ordered = "ordered",
                                                                                                                 /**
                                                                                                                  * Target the candidates in random order.
                                                                                                                  */
                                                                                                                 Randomized = "randomized",
                                                                                                                 /**
                                                                                                                  * Target the candidates in weighted random order.
                                                                                                                  */
                                                                                                                 Weighted = "weighted"
                                                                                                             }

                                                                                                             /**
                                                                                                              * A set predicate that allows for certain values to appear in a set against which the operand will be tested.
                                                                                                              */
                                                                                                             declare interface SetPredicate {
                                                                                                                 /**
                                                                                                                  * The operator associated with this predicate.
                                                                                                                  */
                                                                                                                 readonly operator: SetPredicateOperator;
                                                                                                                 /**
                                                                                                                  * The operand to use when testing this predicate.
                                                                                                                  */
                                                                                                                 readonly operand: Expression[];
                                                                                                             }

                                                                                                             /**
                                                                                                              * Enum containing the valid operators for set predicates.
                                                                                                              */
                                                                                                             declare enum SetPredicateOperator {
                                                                                                                 /**
                                                                                                                  * For a query set Q and a candidate set C: Q and C are disjoint.
                                                                                                                  */
                                                                                                                 None = "none",
                                                                                                                 /**
                                                                                                                  * For a query set Q and a candidate set C: Q and C intersect.
                                                                                                                  */
                                                                                                                 Any = "any",
                                                                                                                 /**
                                                                                                                  * For a query set Q and a candidate set C: Q is a subset of C.
                                                                                                                  */
                                                                                                                 All = "all",
                                                                                                                 /**
                                                                                                                  * For a query set Q and a candidate set C: Q and C are coextensive.
                                                                                                                  */
                                                                                                                 Exactly = "exactly"
                                                                                                             }

                                                                                                             /**
                                                                                                              * A Viv sifting expression, which tests a sifting pattern against either the chronicle,
                                                                                                              * meaning all historical actions, or a character's memories.
                                                                                                              */
                                                                                                             declare interface Sifting extends SourceAnnotatedExpression {
                                                                                                                 /**
                                                                                                                  * Discriminator for a Viv sifting.
                                                                                                                  */
                                                                                                                 readonly type: ExpressionDiscriminator.Sifting;
                                                                                                                 /**
                                                                                                                  * The actual expression value.
                                                                                                                  */
                                                                                                                 readonly value: SiftingValue;
                                                                                                             }

                                                                                                             /**
                                                                                                              * A match for a sifting pattern.
                                                                                                              *
                                                                                                              * This takes the form of a mapping from the role names for the actions defined in
                                                                                                              * the pattern to entity IDs for the actions that were cast in those action roles.
                                                                                                              *
                                                                                                              * If a search domain was specified for the sifting expression, the result will only
                                                                                                              * include actions that are known to the character specified as the search domain.
                                                                                                              *
                                                                                                              * @category Other
                                                                                                              */
                                                                                                             export declare type SiftingMatch = Record<RoleName, UID[]>;

                                                                                                             /**
                                                                                                              * The definition for a sifting pattern, which is used to retrieve a sequence of actions
                                                                                                              * that together may be construed as constituting the events in a story.
                                                                                                              */
                                                                                                             declare interface SiftingPatternDefinition {
                                                                                                                 /**
                                                                                                                  * Discriminator for the sifting-pattern construct type.
                                                                                                                  */
                                                                                                                 readonly type: ConstructDiscriminator.SiftingPattern;
                                                                                                                 /**
                                                                                                                  * The (unique) name of the sifting pattern.
                                                                                                                  */
                                                                                                                 readonly name: SiftingPatternName;
                                                                                                                 /**
                                                                                                                  * Mapping from the names of the roles associated with this sifting pattern to their
                                                                                                                  * respective role definitions.
                                                                                                                  *
                                                                                                                  * This will include the role definitions defined in the 'actions' section of a sifting-pattern
                                                                                                                  * definition, whose role names will also be stored in the `actions` property here.
                                                                                                                  *
                                                                                                                  * Note that the roles appear in the order in which the author defined them.
                                                                                                                  */
                                                                                                                 readonly roles: Record<RoleName, RoleDefinition>;
                                                                                                                 /**
                                                                                                                  * The names of the roles constituting the roots of the trees composing role-dependency
                                                                                                                  * forest for this sifting-pattern definition.
                                                                                                                  *
                                                                                                                  * The roots are given in the order by which role casting will proceed.
                                                                                                                  */
                                                                                                                 readonly roleForestRoots: RoleName[];
                                                                                                                 /**
                                                                                                                  * Conditions for the sifting pattern, grouped by role name (with the special global-conditions key).
                                                                                                                  *
                                                                                                                  * A condition is an expression that must hold (i.e., evaluate to a truthy value) in order
                                                                                                                  * for the sifting pattern to match.
                                                                                                                  */
                                                                                                                 readonly conditions: ConstructConditions;
                                                                                                                 /**
                                                                                                                  * An array containing the roles names for all the actions to expose in a match for this pattern.
                                                                                                                  *
                                                                                                                  * These will correspond to a subset of the roles defined in the `roles` property.
                                                                                                                  */
                                                                                                                 readonly actions: RoleName[];
                                                                                                             }

                                                                                                             /**
                                                                                                              * A unique name for a sifting pattern.
                                                                                                              *
                                                                                                              * @category Other
                                                                                                              */
                                                                                                             export declare type SiftingPatternName = string;

                                                                                                             /**
                                                                                                              * The actual expression value for a Viv sifting.
                                                                                                              */
                                                                                                             declare interface SiftingValue {
                                                                                                                 /**
                                                                                                                  * The name of the sifting pattern to run.
                                                                                                                  */
                                                                                                                 readonly patternName: SiftingPatternName;
                                                                                                                 /**
                                                                                                                  * Precast bindings for the target pattern, as asserted in the sifting expression.
                                                                                                                  */
                                                                                                                 readonly bindings: PrecastBindings;
                                                                                                                 /**
                                                                                                                  * A declaration for how to construct a search domain for this sifting.
                                                                                                                  */
                                                                                                                 readonly searchDomain: SearchDomainDeclaration;
                                                                                                             }

                                                                                                             /**
                                                                                                              * A union of possible types that the hoisted singleton-role top-level properties
                                                                                                              * in an evaluation context may take.
                                                                                                              *
                                                                                                              * Roles that cast entities will initially key an entity ID here, which is hydrated into entity data
                                                                                                              * as needed. This is done as an optimization during the role-casting phase, since upfront hydration
                                                                                                              * can be expensive in cases where entity data is stored in a DB. It also supports author ergonomics,
                                                                                                              * since an author can e.g. write a comparison like `@sender.boss == @receiver`, without worrying
                                                                                                              * whether the roles each store an entity ID. Because symbol roles may cast literal values, we
                                                                                                              * also need to include some literal types here.
                                                                                                              */
                                                                                                             declare type SingletonRoleEvaluationContextValue = UID | EntityView | SymbolRoleBinding;

                                                                                                             /**
                                                                                                              * Mixin for all expression types that specifies metadata about the expression source code.
                                                                                                              */
                                                                                                             declare interface SourceAnnotatedExpression {
                                                                                                                 /**
                                                                                                                  * Annotations on the expression specifying its original source code and position in a source file.
                                                                                                                  *
                                                                                                                  * This will be `null` in certain expressions, such as default values for optional fields,
                                                                                                                  * that do not originate in source code.
                                                                                                                  */
                                                                                                                 readonly source: SourceAnnotations | null;
                                                                                                             }

                                                                                                             /**
                                                                                                              * An object containing annotations on the expression, specifying its original
                                                                                                              * source code and position in a source file.
                                                                                                              */
                                                                                                             declare interface SourceAnnotations {
                                                                                                                 /**
                                                                                                                  * Path to the source file including the expression, relative to the entry file's parent directory.
                                                                                                                  */
                                                                                                                 readonly filePath: string;
                                                                                                                 /**
                                                                                                                  * Line number (1-based) at the start of the expression.
                                                                                                                  */
                                                                                                                 readonly line: number;
                                                                                                                 /**
                                                                                                                  * Column number (1-based) at the start of the expression.
                                                                                                                  */
                                                                                                                 readonly column: number;
                                                                                                                 /**
                                                                                                                  * Line number (1-based) at the end of the expression.
                                                                                                                  */
                                                                                                                 readonly endLine: number;
                                                                                                                 /**
                                                                                                                  * Column number (1-based) at the end of the expression.
                                                                                                                  */
                                                                                                                 readonly endColumn: number;
                                                                                                                 /**
                                                                                                                  * The source code for the expression.
                                                                                                                  */
                                                                                                                 readonly code: string;
                                                                                                             }

                                                                                                             /**
                                                                                                              * Enum containing the Viv special role names that all actions automatically bind.
                                                                                                              */
                                                                                                             declare enum SpecialRoleName {
                                                                                                                 /**
                                                                                                                  * Role that is always bound to the entity ID for the action itself, allowing self-reference.
                                                                                                                  */
                                                                                                                 This = "this",
                                                                                                                 /**
                                                                                                                  * Role that is bound to someone learning about (or being re-exposed to) an action secondhand.
                                                                                                                  */
                                                                                                                 Hearer = "hearer"
                                                                                                             }

                                                                                                             /**
                                                                                                              * A Viv string literal.
                                                                                                              */
                                                                                                             declare interface StringField extends SourceAnnotatedExpression {
                                                                                                                 /**
                                                                                                                  * Discriminator for a Viv string literal.
                                                                                                                  */
                                                                                                                 readonly type: ExpressionDiscriminator.String;
                                                                                                                 /**
                                                                                                                  * The string literal to which this expression will evaluate.
                                                                                                                  */
                                                                                                                 readonly value: string;
                                                                                                             }

                                                                                                             /**
                                                                                                              * A Viv symbol reference, structured as an anchor name and a (possibly empty)
                                                                                                              * path to a specific property value.
                                                                                                              */
                                                                                                             declare interface SymbolReference extends SourceAnnotatedExpression, NegatableExpression {
                                                                                                                 /**
                                                                                                                  * Discriminator for a Viv symbol reference.
                                                                                                                  */
                                                                                                                 readonly type: ExpressionDiscriminator.SymbolReference;
                                                                                                                 /**
                                                                                                                  * The actual expression value.
                                                                                                                  */
                                                                                                                 readonly value: ReferenceValue;
                                                                                                             }

                                                                                                             /**
                                                                                                              * Union containing the possible types for symbol-role bindings.
                                                                                                              *
                                                                                                              * *This is an internal type that is not part of the stable API surface. Its shape may change in any release.*
                                                                                                              *
                                                                                                              * @internal
                                                                                                              * @category Other
                                                                                                              */
                                                                                                             export declare type SymbolRoleBinding = string | number | boolean | null | Record<string, unknown> | unknown[];

                                                                                                             /**
                                                                                                              * Enum specifying the possible statuses associated with action-targeting attempts.
                                                                                                              *
                                                                                                              * @category Debugging
                                                                                                              */
                                                                                                             export declare enum TargetingEventStatus {
                                                                                                                 /**
                                                                                                                  * Targeting of the action has just begun.
                                                                                                                  */
                                                                                                                 Started = "started",
                                                                                                                 /**
                                                                                                                  * The action was successfully targeted and will be performed.
                                                                                                                  */
                                                                                                                 Succeeded = "succeeded",
                                                                                                                 /**
                                                                                                                  * The action could not be targeted (e.g., role casting failed).
                                                                                                                  */
                                                                                                                 Failed = "failed"
                                                                                                             }

                                                                                                             /**
                                                                                                              * A Viv templated string, structured as an ordered array of string literals and string-producing
                                                                                                              * expressions, the evaluations of which are concatenated to form the rendered string.
                                                                                                              */
                                                                                                             declare interface TemplateStringField extends SourceAnnotatedExpression {
                                                                                                                 /**
                                                                                                                  * Discriminator for a Viv templated string.
                                                                                                                  */
                                                                                                                 readonly type: ExpressionDiscriminator.TemplateString;
                                                                                                                 /**
                                                                                                                  * The actual expression value.
                                                                                                                  */
                                                                                                                 readonly value: Array<string | Expression>;
                                                                                                             }

                                                                                                             /**
                                                                                                              * A temporal constraint specifying a range between either points in time or times of day.
                                                                                                              */
                                                                                                             declare type TemporalConstraint = TimeFrameStatement | TimeOfDayStatement;

                                                                                                             /**
                                                                                                              * Enum containing discriminators for the possible temporal constraints.
                                                                                                              */
                                                                                                             declare enum TemporalStatementDiscriminator {
                                                                                                                 /**
                                                                                                                  * Discriminator for a time-frame temporal constraint.
                                                                                                                  */
                                                                                                                 TimeFrame = "timeFrame",
                                                                                                                 /**
                                                                                                                  * Discriminator for a time-of-day temporal constraint.
                                                                                                                  */
                                                                                                                 TimeOfDay = "timeOfDay"
                                                                                                             }

                                                                                                             /**
                                                                                                              * Ticks the Viv planner, causing it to do the following work:
                                                                                                              *  - Target each queued plan and queued plan selector in the global plan queue (in the {@link VivInternalState}).
                                                                                                              *    If a plan is successfully targeted, it will be launched and then immediately greedily executed to the degree
                                                                                                              *    possible, up to potential resolution. In the course of such initial execution, other plans may be queued,
                                                                                                              *    but only ones queued via `urgent` reactions will be immediately targeted upon being queued. If such an
                                                                                                              *    urgently queued plan is successfully targeted right away, it will itself be immediately launched with
                                                                                                              *    initial greedy execution, which may cause additional urgent queueing, and so forth.
                                                                                                              *  - Resume execution of all other plans that were already active at the beginning of the tick.
                                                                                                              *
                                                                                                              * @category Planning
                                                                                                              * @example
                                                                                                              * ```ts
                                                                                                              * await tickPlanner();
                                                                                                              * ```
                                                                                                              * @returns Nothing. All changes are persisted via side effects.
                                                                                                              * @throws {@link VivNotInitializedError} If Viv has not been initialized.
                                                                                                                  * @throws {@link VivInterpreterError} If the Viv interpreter encounters an issue in the course of plan execution.
                                                                                                                      */
                                                                                                                  export declare function tickPlanner(): Promise<void>;

                                                                                                                  /**
                                                                                                                   * A time period (e.g., "2 weeks") that can be used as a delta to resolve a point
                                                                                                                   * in time relative to some anchor time (e.g., the current simulation time).
                                                                                                                   */
                                                                                                                  declare interface TimeDelta {
                                                                                                                      /**
                                                                                                                       * The number of time units -- e.g., `2` in `2 weeks`.
                                                                                                                       */
                                                                                                                      readonly amount: number;
                                                                                                                      /**
                                                                                                                       * The unit of time -- e.g., `weeks` in `2 weeks`.
                                                                                                                       */
                                                                                                                      readonly unit: TimeFrameTimeUnit;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A temporal constraint specifying a range between two points in time.
                                                                                                                   */
                                                                                                                  declare interface TimeFrameStatement {
                                                                                                                      /**
                                                                                                                       * Discriminator for a time-frame temporal constraint.
                                                                                                                       */
                                                                                                                      readonly type: TemporalStatementDiscriminator.TimeFrame;
                                                                                                                      /**
                                                                                                                       * The point in time at which the range opens.
                                                                                                                       *
                                                                                                                       * This is specified as a time delta (e.g., `5 days`) that the host application can resolve at runtime
                                                                                                                       * into a point in time (by anchoring it relative to a given simulation timestamp). If no relative delta
                                                                                                                       * is specified here, the range is open on this end.
                                                                                                                       */
                                                                                                                      readonly open: TimeDelta | null;
                                                                                                                      /**
                                                                                                                       * The point in time at which the range closes.
                                                                                                                       *
                                                                                                                       * This is specified as a time delta (e.g., `5 days`) that the host application can resolve at runtime
                                                                                                                       * into a point in time (by anchoring it relative to a given simulation timestamp). If no delta is
                                                                                                                       * specified here, the range is open on this end.
                                                                                                                       */
                                                                                                                      readonly close: TimeDelta | null;
                                                                                                                      /**
                                                                                                                       * Whether to anchor the time-frame constraint in the timestamp of the action that directly triggered
                                                                                                                       * a reaction -- meaning the action whose definition included the reaction declaration -- as opposed
                                                                                                                       * to the current simulation timestamp.
                                                                                                                       *
                                                                                                                       * This distinction only matters for cases where a reaction is triggered because a character has learned
                                                                                                                       * about an action after the fact. In such cases, we need to know whether a time-frame constraint like
                                                                                                                       * "between 1 year and 3 years" holds relative to the timestamp of the original  action or relative
                                                                                                                       * to the time at which the character learned about the original action.
                                                                                                                       *
                                                                                                                       * Note: The compiler ensures that this field can only be `true` for temporal constraints on reactions.
                                                                                                                       */
                                                                                                                      readonly useActionTimestamp: boolean;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Enum containing the valid time units for time-frame statements.
                                                                                                                   */
                                                                                                                  declare enum TimeFrameTimeUnit {
                                                                                                                      /**
                                                                                                                       * Time unit: minutes.
                                                                                                                       */
                                                                                                                      Minutes = "minutes",
                                                                                                                      /**
                                                                                                                       * Time unit: hours.
                                                                                                                       */
                                                                                                                      Hours = "hours",
                                                                                                                      /**
                                                                                                                       * Time unit: days.
                                                                                                                       */
                                                                                                                      Days = "days",
                                                                                                                      /**
                                                                                                                       * Time unit: weeks.
                                                                                                                       */
                                                                                                                      Weeks = "weeks",
                                                                                                                      /**
                                                                                                                       * Time unit: months.
                                                                                                                       */
                                                                                                                      Months = "months",
                                                                                                                      /**
                                                                                                                       * Time unit: years.
                                                                                                                       */
                                                                                                                      Years = "years"
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * The time of day in the running simulation instance in the host application.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare interface TimeOfDay {
                                                                                                                      /**
                                                                                                                       * The hour of day, specified using the range [0, 23].
                                                                                                                       */
                                                                                                                      readonly hour: number;
                                                                                                                      /**
                                                                                                                       * The minute of the hour of day, specified using the range [0, 59].
                                                                                                                       */
                                                                                                                      readonly minute: number;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A time of day specified by a Viv author.
                                                                                                                   */
                                                                                                                  declare interface TimeOfDayDeclaration {
                                                                                                                      /**
                                                                                                                       * The hour of day.
                                                                                                                       *
                                                                                                                       * The compiler ensures that all values fall in the range `[0, 23]`.
                                                                                                                       */
                                                                                                                      readonly hour: number;
                                                                                                                      /**
                                                                                                                       * The minute of the hour of day.
                                                                                                                       *
                                                                                                                       * The compiler ensures that all values fall in the range `[0, 59]`.
                                                                                                                       */
                                                                                                                      readonly minute: number;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A temporal constraint specifying a range between two times of day.
                                                                                                                   */
                                                                                                                  declare interface TimeOfDayStatement {
                                                                                                                      /**
                                                                                                                       * Discriminator for a time-of-day temporal constraint.
                                                                                                                       */
                                                                                                                      readonly type: TemporalStatementDiscriminator.TimeOfDay;
                                                                                                                      /**
                                                                                                                       * The time of day that opens the range.
                                                                                                                       *
                                                                                                                       * If no time of day is specified here, the range is open on this end.
                                                                                                                       *
                                                                                                                       * Note that the host application is tasked with determining whether a given time of day has passed.
                                                                                                                       */
                                                                                                                      readonly open: TimeOfDayDeclaration | null;
                                                                                                                      /**
                                                                                                                       * The time of day that closes the range.
                                                                                                                       *
                                                                                                                       * If no time of day is specified here, the range is open on this end.
                                                                                                                       *
                                                                                                                       * Note that the host application is tasked with determining whether a given time of day has passed.
                                                                                                                       */
                                                                                                                      readonly close: TimeOfDayDeclaration | null;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A definition for a Viv trope (reusable bundle of conditions).
                                                                                                                   */
                                                                                                                  declare interface TropeDefinition {
                                                                                                                      /**
                                                                                                                       * Discriminator for the trope construct type.
                                                                                                                       */
                                                                                                                      readonly type: ConstructDiscriminator.Trope;
                                                                                                                      /**
                                                                                                                       * The (unique) name of the trope.
                                                                                                                       */
                                                                                                                      readonly name: TropeName;
                                                                                                                      /**
                                                                                                                       * Mapping from the names of the roles associated with this trope to their respective role definitions.
                                                                                                                       *
                                                                                                                       * The roles appear in the order in which the author defined them.
                                                                                                                       */
                                                                                                                      readonly roles: Record<RoleName, RoleDefinition>;
                                                                                                                      /**
                                                                                                                       * The names of the roles constituting the roots of the trees composing role-dependency
                                                                                                                       * forest for this trope definition.
                                                                                                                       *
                                                                                                                       * The roots are given in the order by which role casting will proceed.
                                                                                                                       */
                                                                                                                      readonly roleForestRoots: RoleName[];
                                                                                                                      /**
                                                                                                                       * Conditions for the trope, grouped by role name (with the special global-conditions key).
                                                                                                                       *
                                                                                                                       * A condition is an expression that must hold (i.e., evaluate to a truthy value) in order
                                                                                                                       * for the trope to fit a given cast.
                                                                                                                       */
                                                                                                                      readonly conditions: ConstructConditions;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A Viv trope fit, which evaluates to true if the trope holds with the given arguments.
                                                                                                                   */
                                                                                                                  declare interface TropeFit extends SourceAnnotatedExpression, NegatableExpression {
                                                                                                                      /**
                                                                                                                       * Discriminator for a Viv trope fit.
                                                                                                                       */
                                                                                                                      readonly type: ExpressionDiscriminator.TropeFit;
                                                                                                                      /**
                                                                                                                       * The actual expression value.
                                                                                                                       */
                                                                                                                      readonly value: TropeFitValue;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * The actual expression value for a Viv trope fit.
                                                                                                                   */
                                                                                                                  declare interface TropeFitValue {
                                                                                                                      /**
                                                                                                                       * The name of the trope that will be used for the test.
                                                                                                                       */
                                                                                                                      readonly tropeName: TropeName;
                                                                                                                      /**
                                                                                                                       * Precast bindings for the target trope, as asserted in the trope-fit expression.
                                                                                                                       */
                                                                                                                      readonly bindings: PrecastBindings;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A unique name for a trope.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare type TropeName = string;

                                                                                                                  /**
                                                                                                                   * A unique identifier in the host application that is provisioned by the host application.
                                                                                                                   *
                                                                                                                   * These do not need to be UUIDs, but they do need to be UIDs with regard to the running instance
                                                                                                                   * of the host application at hand.
                                                                                                                   *
                                                                                                                   * When a UID is associated with an {@link EntityView} in the storyworld of the running
                                                                                                                   * instance of the host application, it is referred to as an 'entity ID'. This term is used
                                                                                                                   * throughout the Viv codebase accordingly.
                                                                                                                   *
                                                                                                                   * @category Integration
                                                                                                                   */
                                                                                                                  export declare type UID = string;

                                                                                                                  /**
                                                                                                                   * Enum containing the possible subjects of a failed validation.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare enum ValidationErrorSubject {
                                                                                                                      /**
                                                                                                                       * A content bundle that failed validation upon registration.
                                                                                                                       */
                                                                                                                      ContentBundle = "contentBundle",
                                                                                                                      /**
                                                                                                                       * A host-application adapter that failed validation upon registration.
                                                                                                                       */
                                                                                                                      Adapter = "adapter",
                                                                                                                      /**
                                                                                                                       * Arguments to a Viv API function that failed validation upon invocation.
                                                                                                                       */
                                                                                                                      APICall = "apiCall"
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * The name for a variable used in an assignment or a loop.
                                                                                                                   */
                                                                                                                  declare type VariableName = string;

                                                                                                                  /**
                                                                                                                   * Base class for all Viv runtime errors.
                                                                                                                   *
                                                                                                                   * Consumers who want to catch any Viv error can use `instanceof VivError`.
                                                                                                                   *
                                                                                                                   * Note: A `VivError` will never be thrown directly.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivError extends Error {
                                                                                                                      /**
                                                                                                                       * The name for a `VivError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       */
                                                                                                                      constructor(msg: string);
                                                                                                                      /**
                                                                                                                       * A custom inspect handler that produces a human-readable summary of the error.
                                                                                                                       *
                                                                                                                       * This handler will be invoked when the error is displayed in Node via `console.log`,
                                                                                                                       * `console.error`, `util.inspect`, or its uncaught-exception output.
                                                                                                                       *
                                                                                                                       * A few notes
                                                                                                                       *  - This method only controls the display format. The structured properties will
                                                                                                                       * remain available for programmatic access.
                                                                                                                       *  - The child error types may override this with more specific handlers.
                                                                                                                       *
                                                                                                                       * @param depth - The current recursion depth in the Node inspect call.
                                                                                                                       * @param options - The Node inspect options (used to determine whether colors are enabled).
                                                                                                                       * @returns A formatted string summarizing the error.
                                                                                                                       */
                                                                                                                      [NODE_INSPECT_SYMBOL](depth: number, options: {
                                                                                                                          colors: boolean;
                                                                                                                      }): string;
                                                                                                                      /**
                                                                                                                       * Returns a formatted human-readable summary of the error.
                                                                                                                       */
                                                                                                                      toString(): string;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Enum containing the canonical error names.
                                                                                                                   *
                                                                                                                   * *This is an internal type that is not part of the stable API surface. Its shape may change in any release.*
                                                                                                                   *
                                                                                                                   * @internal
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare enum VivErrorName {
                                                                                                                      /**
                                                                                                                       * Base error from which all Viv runtime errors inherit.
                                                                                                                       */
                                                                                                                      VivError = "VivError",
                                                                                                                      /**
                                                                                                                       * thrown when something goes wrong during Viv runtime execution.
                                                                                                                       */
                                                                                                                      VivExecutionError = "VivExecutionError",
                                                                                                                      /**
                                                                                                                       * Error thrown when the Viv runtime reaches a state that should be impossible.
                                                                                                                       */
                                                                                                                      VivInternalError = "VivInternalError",
                                                                                                                      /**
                                                                                                                       * Error thrown when the interpreter crashes when attempting to evaluate a Viv expression.
                                                                                                                       */
                                                                                                                      VivInterpreterError = "VivInterpreterError",
                                                                                                                      /**
                                                                                                                       * Error thrown when a Viv runtime API function is called before the runtime has been initialized.
                                                                                                                       */
                                                                                                                      VivNotInitializedError = "VivNotInitializedError",
                                                                                                                      /**
                                                                                                                       * Error thrown when role casting fails in the course of targeting a construct.
                                                                                                                       */
                                                                                                                      VivRoleCastingError = "VivRoleCastingError",
                                                                                                                      /**
                                                                                                                       * Error thrown when validation fails for some data at a touch point between the Viv runtime
                                                                                                                       * and the host application.
                                                                                                                       */
                                                                                                                      VivValidationError = "VivValidationError"
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Error thrown when something goes wrong during Viv runtime execution.
                                                                                                                   *
                                                                                                                   * This includes failures in the interpreter, role caster, planner, and other subsystems that
                                                                                                                   * act on compiled Viv content. Generally, such failures are caused by authoring errors in the
                                                                                                                   * compiled content bundle.
                                                                                                                   *
                                                                                                                   * While occasionally a `VivExecutionError` will be thrown directly, usually execution issues
                                                                                                                   * will cause a child error type to be thrown:
                                                                                                                   *  - {@link VivInterpreterError}: A Viv expression could not be evaluated.
                                                                                                                   *  - {@link VivRoleCastingError}: A given construct role could not be cast.
                                                                                                                   *
                                                                                                                   * Though certainly not ideal, execution errors may be recoverable in production, e.g., by skipping
                                                                                                                   * a problematic construct and logging a warning.
                                                                                                                   *
                                                                                                                   * Consumers who want to catch any execution-phase error can use `instanceof VivExecutionError`.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivExecutionError extends VivError {
                                                                                                                      /**
                                                                                                                       * The name for a `VivExecutionError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * If applicable, an object containing additional context, such as the evaluations
                                                                                                                       * of certain fields or intermediate concerns.
                                                                                                                       *
                                                                                                                       * The key names used here will be descriptive.
                                                                                                                       */
                                                                                                                      readonly extraContext?: Record<string, unknown>;
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivExecutionError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       * @param extraContext - If applicable, an object containing additional context, such as the
                                                                                                                       *     evaluations of certain fields or intermediate concerns.
                                                                                                                       */
                                                                                                                      constructor(msg: string, extraContext?: Record<string, unknown>);
                                                                                                                      /**
                                                                                                                       * A custom inspect handler that produces a human-readable summary of the error.
                                                                                                                       *
                                                                                                                       * This handler will be invoked when the error is displayed in Node via `console.log`,
                                                                                                                       * `console.error`, `util.inspect`, or its uncaught-exception output.
                                                                                                                       *
                                                                                                                       * Note: This method only controls the display format. The structured properties will
                                                                                                                       * remain available for programmatic access.
                                                                                                                       *
                                                                                                                       * @param depth - The current recursion depth in the Node inspect call.
                                                                                                                       * @param options - The Node inspect options (used to determine whether colors are enabled).
                                                                                                                       * @returns A formatted string summarizing the error.
                                                                                                                       */
                                                                                                                      [NODE_INSPECT_SYMBOL](depth: number, options: {
                                                                                                                          colors: boolean;
                                                                                                                      }): string;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Error thrown when the Viv runtime reaches a state that should be impossible.
                                                                                                                   *
                                                                                                                   * A `VivInternalError` indicates a bug in the Viv runtime itself, not a content or integration issue.
                                                                                                                   *
                                                                                                                   * If you encounter an instance of this error, please report it.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivInternalError extends VivError {
                                                                                                                      /**
                                                                                                                       * The name for a `VivInternalError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivInternalError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       */
                                                                                                                      constructor(msg: string);
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Internal state required by the Viv runtime. The host application must persist this state,
                                                                                                                   * but Viv is in charge of managing it (via calls to {@link HostApplicationAdapter.saveVivInternalState}).
                                                                                                                   *
                                                                                                                   * @category Integration
                                                                                                                   */
                                                                                                                  export declare interface VivInternalState {
                                                                                                                      /**
                                                                                                                       * A mapping from entity ID for a character to an array storing queued actions (and queued action selectors)
                                                                                                                       * for that character, with the following invariants: urgent actions come first, and the two buckets (urgent,
                                                                                                                       * non-urgent) are themselves sorted in order of priority. Character keys are added only as needed.
                                                                                                                       */
                                                                                                                      readonly actionQueues: Record<UID, ActionQueue>;
                                                                                                                      /**
                                                                                                                       * The global plan queue, which stores all queued plans (and queued plan selectors). This is not keyed
                                                                                                                       * by character because plans are not associated with initiators (they can orchestrate complex action
                                                                                                                       * sequences across multiple total initiators). While this is maintained as a FIFO queue, it can more
                                                                                                                       * accurately be considered to be conceptually unordered, because all queued plans are pursued every
                                                                                                                       * planner tick, and a plan launched before another one on the same tick has no advantage as far as
                                                                                                                       * being the first to action performance. This is because plans can only queue actions -- and not
                                                                                                                       * cause them to be immediately performed -- and the action manager always pursues queued actions
                                                                                                                       * in priority order.
                                                                                                                       */
                                                                                                                      planQueue: PlanQueue;
                                                                                                                      /**
                                                                                                                       * A mapping from plan UID to plan state, for all active plans. A plan is active between launching
                                                                                                                       * (not queueing) and reaching either a success or failure state.
                                                                                                                       */
                                                                                                                      readonly activePlans: Record<UID, PlanState>;
                                                                                                                      /**
                                                                                                                       * A mapping from queued-construct UID to queued-construct status, for all constructs that
                                                                                                                       * have ever been queued. Note that entries are never deleted.
                                                                                                                       */
                                                                                                                      queuedConstructStatuses: QueuedConstructStatuses;
                                                                                                                      /**
                                                                                                                       * A mapping from action name to an array containing all active embargoes associated with that action.
                                                                                                                       *
                                                                                                                       * Action embargoes are a kind of authorial affordance that allows a Viv author to constrain the
                                                                                                                       * subsequent performance of some action according to various constraints. For instance, an embargo
                                                                                                                       * can prevent a character from performing the same action for some period of time, or from doing so
                                                                                                                       * at the same location, and so forth. Embargoes can specify locations, time windows, and arbitrary
                                                                                                                       * subsets of an action's bindings.
                                                                                                                       */
                                                                                                                      readonly actionEmbargoes: Record<ActionName, ActiveEmbargo[]>;
                                                                                                                      /**
                                                                                                                       * The story-time timestamp at which memory saliences were last decayed.
                                                                                                                       *
                                                                                                                       * This value is used as the starting point for computing elapsed time when fading character
                                                                                                                       * memories. It is initialized to `null` until a first instance of memory fading occurs.
                                                                                                                       */
                                                                                                                      lastMemoryDecayTimestamp: DiegeticTimestamp | null;
                                                                                                                      /**
                                                                                                                       * When applicable, live data associated with the debugging facilities of the Viv runtime.
                                                                                                                       */
                                                                                                                      debugging?: VivInternalStateDebugging;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Data associated with the debugging facilities of the Viv runtime.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare interface VivInternalStateDebugging {
                                                                                                                      /**
                                                                                                                       * Watchlists containing debugging information about a set of constructs that the host
                                                                                                                       * application's Viv adapter has identified for watching.
                                                                                                                       */
                                                                                                                      readonly watchlists?: VivInternalStateDebuggingWatchlists;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Watchlists containing debugging information about a set of constructs that the host
                                                                                                                   * application's Viv adapter has identified for watching.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare interface VivInternalStateDebuggingWatchlists {
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched action to debugging information for the action.
                                                                                                                       */
                                                                                                                      readonly actions: Record<ActionName, WatchedConstructDebuggingState>;
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched action selector to debugging information for the selector.
                                                                                                                       */
                                                                                                                      readonly actionSelectors: Record<SelectorName, WatchedConstructDebuggingState>;
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched plan to debugging information for the plan.
                                                                                                                       */
                                                                                                                      readonly plans: Record<PlanName, WatchedConstructDebuggingState>;
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched plan selector to debugging information for the selector.
                                                                                                                       */
                                                                                                                      readonly planSelectors: Record<SelectorName, WatchedConstructDebuggingState>;
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched query to debugging information for the query.
                                                                                                                       */
                                                                                                                      readonly queries: Record<QueryName, WatchedConstructDebuggingState>;
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched sifting pattern to debugging information for the pattern.
                                                                                                                       */
                                                                                                                      readonly siftingPatterns: Record<SiftingPatternName, WatchedConstructDebuggingState>;
                                                                                                                      /**
                                                                                                                       * A mapping from the name of a watched trope to debugging information for the trope.
                                                                                                                       */
                                                                                                                      readonly tropes: Record<TropeName, WatchedConstructDebuggingState>;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Error thrown when the Viv interpreter fails to evaluate an expression.
                                                                                                                   *
                                                                                                                   * These errors occur due to authoring issues in the compiled content bundle that cannot be detected
                                                                                                                   * at compilation time, because they depend on the live simulation state. Usually the cause is some
                                                                                                                   * kind of type issue, such an array access where the key expression does not evaluate to an integer.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivInterpreterError extends VivExecutionError {
                                                                                                                      /**
                                                                                                                       * The name for a `VivInterpreterError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * The Viv expression at hand when the failure occurred.
                                                                                                                       */
                                                                                                                      readonly expression: Expression;
                                                                                                                      /**
                                                                                                                       * The evaluation context at hand when the failure occurred.
                                                                                                                       */
                                                                                                                      readonly evaluationContext: EvaluationContext;
                                                                                                                      /**
                                                                                                                       * If applicable, an exception that caused the interpreter failure that is external in origin,
                                                                                                                       * due to originating in a call to a {@link CustomFunction} exposed in the
                                                                                                                       * host-application adapter.
                                                                                                                       */
                                                                                                                      readonly externalCause?: unknown;
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivInterpreterError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       * @param expression - The Viv expression at hand when the failure occurred.
                                                                                                                       * @param context - The evaluation context at hand when the failure occurred.
                                                                                                                       * @param extraContext - If applicable, an object containing additional context, such as the
                                                                                                                       *     evaluations of certain fields or intermediate concerns.
                                                                                                                       * @param externalCause - If applicable, the external exception that caused the interpreter failure.
                                                                                                                       */
                                                                                                                      constructor(msg: string, expression: Expression, context: EvaluationContext, extraContext?: Record<string, unknown>, externalCause?: unknown);
                                                                                                                      /**
                                                                                                                       * A custom inspect handler that produces a human-readable summary of the error.
                                                                                                                       *
                                                                                                                       * This handler will be invoked when the error is displayed in Node via `console.log`,
                                                                                                                       * `console.error`, `util.inspect`, or its uncaught-exception output.
                                                                                                                       *
                                                                                                                       * Note: This method only controls the display format. The structured properties will
                                                                                                                       * remain available for programmatic access.
                                                                                                                       *
                                                                                                                       * @param depth - The current recursion depth in the Node inspect call.
                                                                                                                       * @param options - The Node inspect options (used to determine whether colors are enabled).
                                                                                                                       * @returns A formatted string summarizing the error.
                                                                                                                       */
                                                                                                                      [NODE_INSPECT_SYMBOL](depth: number, options: {
                                                                                                                          colors: boolean;
                                                                                                                      }): string;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Error thrown when a Viv runtime API function is called before the runtime has been initialized.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivNotInitializedError extends VivError {
                                                                                                                      /**
                                                                                                                       * The name for a `VivNotInitializedError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivNotInitializedError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       */
                                                                                                                      constructor(msg: string);
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Error thrown while performing role casting for a given construct.
                                                                                                                   *
                                                                                                                   * These errors occur due to authoring issues in the compiled content bundle that cannot be detected
                                                                                                                   * at compilation time, because they depend on the live simulation state. Examples include malformed
                                                                                                                   * precast bindings, bad casting pools, or candidates that violate role constraints.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivRoleCastingError extends VivExecutionError {
                                                                                                                      /**
                                                                                                                       * The name for a `VivRoleCastingError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * The type of construct being targeted when the error occurred.
                                                                                                                       */
                                                                                                                      readonly constructType: ConstructDiscriminator;
                                                                                                                      /**
                                                                                                                       * The name of the construct being targeted when the error occurred.
                                                                                                                       */
                                                                                                                      readonly constructName: ConstructName;
                                                                                                                      /**
                                                                                                                       * The name of the role that was being cast when the failure occurred.
                                                                                                                       */
                                                                                                                      readonly roleName: RoleName;
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivRoleCastingError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       * @param constructDefinition - Definition for the construct being targeted when the error occurred.
                                                                                                                       * @param roleName - Name of the role involved in the failure.
                                                                                                                       * @param extraContext - If applicable, an object containing additional context about the failure.
                                                                                                                       */
                                                                                                                      constructor(msg: string, constructDefinition: ConstructDefinition, roleName: RoleName, extraContext?: Record<string, unknown>);
                                                                                                                      /**
                                                                                                                       * A custom inspect handler that produces a human-readable summary of the error.
                                                                                                                       *
                                                                                                                       * This handler will be invoked when the error is displayed in Node via `console.log`,
                                                                                                                       * `console.error`, `util.inspect`, or its uncaught-exception output.
                                                                                                                       *
                                                                                                                       * Note: This method only controls the display format. The structured properties will
                                                                                                                       * remain available for programmatic access.
                                                                                                                       *
                                                                                                                       * @param depth - The current recursion depth in the Node inspect call.
                                                                                                                       * @param options - The Node inspect options (used to determine whether colors are enabled).
                                                                                                                       * @returns A formatted string summarizing the error.
                                                                                                                       */
                                                                                                                      [NODE_INSPECT_SYMBOL](depth: number, options: {
                                                                                                                          colors: boolean;
                                                                                                                      }): string;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Returns whether the Viv runtime has been initialized successfully.
                                                                                                                   *
                                                                                                                   * @category Initialization
                                                                                                                   * @example
                                                                                                                   * ```ts
                                                                                                                   * const vivIsInitialized = vivRuntimeIsInitialized();
                                                                                                                   * ```
                                                                                                                   * @returns - See {@link VivRuntimeIsInitializedResult}.
                                                                                                                   */
                                                                                                                  export declare function vivRuntimeIsInitialized(): VivRuntimeIsInitializedResult;

                                                                                                                  /**
                                                                                                                   * Whether the Viv runtime has been initialized successfully.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   * @remarks This is the return value for {@link vivRuntimeIsInitialized}.
                                                                                                                   */
                                                                                                                  export declare type VivRuntimeIsInitializedResult = boolean;

                                                                                                                  /**
                                                                                                                   * Error thrown when validation fails for data at a touch point between
                                                                                                                   * the Viv runtime and a host application.
                                                                                                                   *
                                                                                                                   * @category Errors
                                                                                                                   */
                                                                                                                  export declare class VivValidationError extends VivError {
                                                                                                                      /**
                                                                                                                       * The name for a `VivValidationError`.
                                                                                                                       */
                                                                                                                      readonly name: VivErrorName;
                                                                                                                      /**
                                                                                                                       * The kind of data that was being validated when the failure occurred.
                                                                                                                       */
                                                                                                                      readonly subject: ValidationErrorSubject;
                                                                                                                      /**
                                                                                                                       * An array containing human-readable explanations of the specific validation issues.
                                                                                                                       */
                                                                                                                      readonly validationErrors: string[];
                                                                                                                      /**
                                                                                                                       * Constructs a new {@link VivValidationError}.
                                                                                                                       *
                                                                                                                       * @param msg - A human-readable summary of the failure.
                                                                                                                       * @param subject - The kind of data that was being validated.
                                                                                                                       * @param validationErrors - The validation errors reported by the validator, if any.
                                                                                                                       */
                                                                                                                      constructor(msg: string, subject: ValidationErrorSubject, validationErrors: string[]);
                                                                                                                      /**
                                                                                                                       * A custom inspect handler that produces a human-readable summary of the error.
                                                                                                                       *
                                                                                                                       * This handler will be invoked when the error is displayed in Node via `console.log`,
                                                                                                                       * `console.error`, `util.inspect`, or its uncaught-exception output.
                                                                                                                       *
                                                                                                                       * Note: This method only controls the display format. The structured properties will
                                                                                                                       * remain available for programmatic access.
                                                                                                                       *
                                                                                                                       * @param depth - The current recursion depth in the Node inspect call.
                                                                                                                       * @param options - The Node inspect options (used to determine whether colors are enabled).
                                                                                                                       * @returns A formatted string summarizing the error.
                                                                                                                       */
                                                                                                                      [NODE_INSPECT_SYMBOL](depth: number, options: {
                                                                                                                          colors: boolean;
                                                                                                                      }): string;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * Debugging information for a watched construct, capturing information about attempts to target it.
                                                                                                                   *
                                                                                                                   * This information can be used to investigate why a construct has not been successfully targeted,
                                                                                                                   * especially if this is due to something like a mistyped condition.
                                                                                                                   *
                                                                                                                   * @category Other
                                                                                                                   */
                                                                                                                  export declare interface WatchedConstructDebuggingState {
                                                                                                                      /**
                                                                                                                       * The number of times this construct was targeted during the debugging window.
                                                                                                                       */
                                                                                                                      targetingAttempts: number;
                                                                                                                      /**
                                                                                                                       * A mapping from role name to the number of attempts to cast that role during the debugging window.
                                                                                                                       */
                                                                                                                      castingAttempts: Record<RoleName, number>;
                                                                                                                      /**
                                                                                                                       * A mapping from role name to counts for each of the possible backtracking reasons,
                                                                                                                       * where the counts apply to attempts to cast this role during the debugging window.
                                                                                                                       */
                                                                                                                      backtrackingReasons: Record<RoleName, BacktrackingReasonCounts>;
                                                                                                                      /**
                                                                                                                       * An object recording for a given condition its number of successes
                                                                                                                       * and failures (across tests of the condition).
                                                                                                                       */
                                                                                                                      conditionTestResults: Record<string, ConditionResultCounts>;
                                                                                                                  }

                                                                                                                  /**
                                                                                                                   * A Viv expression wrapped with an array containing the names of all roles that it references.
                                                                                                                   *
                                                                                                                   * These reference lists are used for various optimizations.
                                                                                                                   */
                                                                                                                  declare interface WrappedExpression {
                                                                                                                      /**
                                                                                                                       * The actual expression that is being wrapped.
                                                                                                                       */
                                                                                                                      readonly body: Expression;
                                                                                                                      /**
                                                                                                                       * Names of the roles referenced in the AST chunk constituting the expression.
                                                                                                                       *
                                                                                                                       * This field is used to support various optimizations.
                                                                                                                       */
                                                                                                                      readonly references: RoleName[];
                                                                                                                  }

                                                                                                                  export { }
